import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../assets/styles/BooksLibrary.css";
import { API_BASE, getMarkdownBooks, getMarkdownBookContentSilent } from "../Api";
import { hasCachedBookContent, setCachedBookContent } from "../bookCache";

const normalizeTitle = (title) =>
  String(title || "")
    .replace(/\s*\(\d{4}\)\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();

const getSeriesInfo = (title) => {
  const raw = String(title || "");
  if (!raw.includes("_")) return null;
  const parts = raw.split("_");
  const prefix = parts.shift()?.trim() || "";
  const suffix = parts.join("_").trim();
  if (!prefix) return null;
  return {
    group: prefix,
    label: suffix || raw
  };
};

const getBucket = (title) => {
  const match = String(title || "").match(/[A-Za-z]/);
  const first = match ? match[0].toUpperCase() : "#";
  if ("ABCD".includes(first)) return "A-D";
  if ("EFGH".includes(first)) return "E-H";
  if ("IJKL".includes(first)) return "I-L";
  if ("MNOP".includes(first)) return "M-P";
  if ("QRST".includes(first)) return "Q-T";
  if ("UVWXYZ".includes(first)) return "U-Z";
  return "Other";
};

const resolveBookCoverUrl = (coverPath = "") => {
  if (!coverPath) return "";
  const normalized = coverPath.startsWith("/") ? coverPath : `/${coverPath}`;
  return `${API_BASE}${normalized}`;
};

const BooksLibrary = () => {
  const [books, setBooks] = useState([]);
  const [bookQuery, setBookQuery] = useState("");
  const [openGroups, setOpenGroups] = useState({});
  const [expandAllGroups, setExpandAllGroups] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [prefetching, setPrefetching] = useState(false);
  const [prefetchTotal, setPrefetchTotal] = useState(0);
  const [prefetchLoaded, setPrefetchLoaded] = useState(0);
  const [prefetchErrors, setPrefetchErrors] = useState(0);

  useEffect(() => {
    let isActive = true;
    setLoading(true);
    setError("");

    getMarkdownBooks()
      .then((res) => {
        if (!isActive) return;
        setBooks(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!isActive) return;
        setError("Failed to load the library.");
      })
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!books.length) return;
    let isActive = true;
    const controller = new AbortController();
    const uncached = books
      .map((book) => book.fileName)
      .filter((fileName) => fileName && !hasCachedBookContent(fileName));

    if (!uncached.length) {
      setPrefetching(false);
      setPrefetchTotal(0);
      setPrefetchLoaded(0);
      setPrefetchErrors(0);
      return () => {
        controller.abort();
      };
    }

    setPrefetching(true);
    setPrefetchTotal(uncached.length);
    setPrefetchLoaded(0);
    setPrefetchErrors(0);

    const concurrency = 4;
    let index = 0;
    let inFlight = 0;

    const launchNext = () => {
      if (!isActive) return;
      while (inFlight < concurrency && index < uncached.length) {
        const fileName = uncached[index];
        index += 1;
        inFlight += 1;
        getMarkdownBookContentSilent(fileName, { signal: controller.signal })
          .then((res) => {
            if (!isActive) return;
            const text = typeof res.data === "string" ? res.data : "";
            if (typeof text === "string") {
              setCachedBookContent(fileName, text);
            }
          })
          .catch((error) => {
            if (!isActive) return;
            if (error?.name === "CanceledError" || error?.code === "ERR_CANCELED") {
              return;
            }
            setPrefetchErrors((prev) => prev + 1);
          })
          .finally(() => {
            if (!isActive) return;
            inFlight -= 1;
            setPrefetchLoaded((prev) => prev + 1);
            if (index >= uncached.length && inFlight === 0) {
              setPrefetching(false);
              return;
            }
            launchNext();
          });
      }
    };

    launchNext();

    return () => {
      isActive = false;
      controller.abort();
    };
  }, [books]);

  const filteredBooks = useMemo(() => {
    const query = bookQuery.trim().toLowerCase();
    if (!query) return books;
    return books.filter((book) => {
      const title = (book.title || "").toLowerCase();
      const fileName = (book.fileName || "").toLowerCase();
      return title.includes(query) || fileName.includes(query);
    });
  }, [books, bookQuery]);

  const libraryGroups = useMemo(() => {
    const coreKeys = [
      "player's handbook",
      "dungeon master's guide",
      "monster manual"
    ];
    const core = [];
    const seriesMap = new Map();
    const bucketMap = new Map();

    const pushToBucket = (bucket, entry) => {
      if (!bucketMap.has(bucket)) bucketMap.set(bucket, []);
      bucketMap.get(bucket).push(entry);
    };

    filteredBooks.forEach((book) => {
      const rawTitle = book.title || book.fileName;
      const normalized = normalizeTitle(rawTitle);
      const lower = normalized.toLowerCase();
      const isCore = coreKeys.some((key) => lower.startsWith(key));

      if (isCore) {
        core.push({ ...book, displayTitle: rawTitle });
        return;
      }

      const seriesInfo = getSeriesInfo(rawTitle);
      if (seriesInfo) {
        const existing = seriesMap.get(seriesInfo.group) || [];
        existing.push({ ...book, displayTitle: seriesInfo.label });
        seriesMap.set(seriesInfo.group, existing);
        return;
      }

      const bucket = getBucket(normalized);
      pushToBucket(bucket, { ...book, displayTitle: rawTitle });
    });

    const sortByTitle = (a, b) =>
      String(a.displayTitle || "").localeCompare(String(b.displayTitle || ""), undefined, { numeric: true });

    core.sort(sortByTitle);
    const groups = [];

    if (core.length) {
      groups.push({ id: "core", title: "Core Rulebooks", books: core });
    }

    Array.from(seriesMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([series, items]) => {
        items.sort(sortByTitle);
        groups.push({ id: `series:${series}`, title: series, books: items });
      });

    const bucketOrder = ["A-D", "E-H", "I-L", "M-P", "Q-T", "U-Z", "Other"];
    bucketOrder.forEach((bucket) => {
      const items = bucketMap.get(bucket);
      if (!items || !items.length) return;
      items.sort(sortByTitle);
      groups.push({ id: `bucket:${bucket}`, title: bucket, books: items });
    });

    return groups;
  }, [filteredBooks]);

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      libraryGroups.forEach((group) => {
        if (!(group.id in next)) {
          next[group.id] = group.id === "core";
        }
      });
      return next;
    });
  }, [libraryGroups]);

  const prefetchPercent = prefetchTotal
    ? Math.round((prefetchLoaded / prefetchTotal) * 100)
    : 0;

  const LibrarySkeleton = () => {
    const groups = Array.from({ length: 4 }, (_, index) => index);
    const rows = Array.from({ length: 4 }, (_, index) => index);
    return (
      <div className="books-library-skeleton">
        {groups.map((groupIndex) => (
          <div key={groupIndex} className="books-library-skeleton-group">
            <div className="books-library-skeleton-heading" />
            <div className="books-library-skeleton-rows">
              {rows.map((rowIndex) => (
                <div
                  key={`${groupIndex}-${rowIndex}`}
                  className={`books-library-skeleton-row${rowIndex === 0 ? " is-wide" : ""}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="books-library-page">
      <div className="books-library-shell">
        <header className="books-library-header">
          <div>
            <div className="books-library-kicker">Library</div>
            <h1>Rules Library</h1>
            <p>Pick a book to open the reader.</p>
          </div>
          <div className="books-library-header-meta">
            <span className="books-library-chip">{filteredBooks.length} titles</span>
            <span className="books-library-chip">Markdown sources</span>
          </div>
        </header>

        <div className="books-library-toolbar">
          <input
            className="books-library-search"
            type="text"
            placeholder="Search titles"
            value={bookQuery}
            onChange={(event) => setBookQuery(event.target.value)}
          />
          <button
            className={`books-library-button${expandAllGroups ? " is-active" : ""}`}
            type="button"
            onClick={() => setExpandAllGroups((prev) => !prev)}
          >
            {expandAllGroups ? "Collapse all" : "Expand all"}
          </button>
        </div>

        <div className="books-library-list">
          {loading ? (
            <LibrarySkeleton />
          ) : error ? (
            <div className="books-library-error">{error}</div>
          ) : filteredBooks.length === 0 ? (
            <div className="books-library-empty">No books match that search.</div>
          ) : (
            libraryGroups.map((group) => {
              const isSearchActive = bookQuery.trim().length > 0;
              const isOpen = isSearchActive || expandAllGroups ? true : !!openGroups[group.id];
              return (
                <section key={group.id} className="books-library-group">
                  <button
                    type="button"
                    className="books-library-group-toggle"
                    onClick={() =>
                      setOpenGroups((prev) => ({
                        ...prev,
                        [group.id]: !isOpen
                      }))
                    }
                    aria-expanded={isOpen}
                  >
                    <span>{group.title}</span>
                    <span className="books-library-group-meta">
                      <span className="books-library-group-count">{group.books.length}</span>
                      <span className="books-library-group-icon">{isOpen ? "-" : "+"}</span>
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="books-library-books">
                      {group.books.map((book) => {
                        const updated = book.lastModifiedUtc
                          ? new Date(book.lastModifiedUtc).toLocaleDateString()
                          : "";
                        const coverUrl = resolveBookCoverUrl(book.coverImagePath);
                        const displayTitle = book.displayTitle || book.title || book.fileName;
                        return (
                          <Link
                            key={book.fileName}
                            to={`/books/rules/${encodeURIComponent(book.fileName)}`}
                            className="books-library-book"
                          >
                            <div className="books-library-book-cover">
                              {coverUrl ? (
                                <img
                                  src={coverUrl}
                                  alt={`${displayTitle} cover`}
                                  loading="lazy"
                                />
                              ) : (
                                <div className="books-library-book-cover-placeholder">
                                  No image
                                </div>
                              )}
                            </div>
                            <div className="books-library-book-body">
                              <div className="books-library-book-title">{displayTitle}</div>
                              <div className="books-library-book-meta">
                                {updated ? `Updated ${updated}` : "Update date unknown"}
                              </div>
                            </div>
                            <span className="books-library-book-action">Open</span>
                          </Link>
                        );
                      })}
                    </div>
                  ) : null}
                </section>
              );
            })
          )}
        </div>
      </div>
      {prefetching ? (
        <div className="books-library-prefetch" role="status" aria-live="polite">
          <div className="books-library-prefetch-card">
            <div className="books-library-spinner" />
            <div className="books-library-prefetch-body">
              <div className="books-library-prefetch-title">Preparing the library</div>
              <div className="books-library-prefetch-subtitle">
                Loading {prefetchLoaded} of {prefetchTotal} books ({prefetchPercent}%)
              </div>
              <div className="books-library-prefetch-progress">
                <div
                  className="books-library-prefetch-progress-bar"
                  style={{ width: `${prefetchPercent}%` }}
                />
              </div>
              <div className="books-library-prefetch-hint">
                Everything will open instantly once this finishes.
              </div>
              {prefetchErrors > 0 ? (
                <div className="books-library-prefetch-error">
                  {prefetchErrors} book{prefetchErrors === 1 ? "" : "s"} failed to prefetch.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default BooksLibrary;
