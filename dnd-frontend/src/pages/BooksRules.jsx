import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "../assets/styles/BooksRules.css";
import { API_BASE, getMarkdownBooks, getMarkdownBookContent } from "../Api";
import { getCachedBookContent, setCachedBookContent } from "../bookCache";

const createSlugger = () => {
  const counts = {};
  return (value) => {
    const raw = String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const base = raw || "section";
    const count = counts[base] || 0;
    counts[base] = count + 1;
    return count ? `${base}-${count}` : base;
  };
};

const getNodeText = (node) => {
  if (node === null || node === undefined) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join("");
  if (node.props && node.props.children) return getNodeText(node.props.children);
  return "";
};

const resolveMarkdownImageSrc = (src) => {
  if (!src) return "";
  if (/^https?:\/\//i.test(src) || /^data:/i.test(src)) return src;
  const normalized = src.startsWith("/") ? src : `/${src}`;
  return `${API_BASE}${normalized}`;
};

const MarkdownImage = ({ src = "", alt = "" }) => {
  const resolvedSrc = resolveMarkdownImageSrc(src);
  if (!resolvedSrc) {
    return (
      <figure className="books-rules-figure">
        <div className="books-rules-missing-image">Image unavailable</div>
        {alt ? <figcaption>{alt}</figcaption> : null}
      </figure>
    );
  }

  return (
    <figure className="books-rules-figure">
      <img src={resolvedSrc} alt={alt || "Book illustration"} loading="lazy" />
      {alt ? <figcaption>{alt}</figcaption> : null}
    </figure>
  );
};

const MarkdownLink = ({ href = "", children }) => {
  const isExternal = /^https?:\/\//i.test(href);
  return (
    <a href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined}>
      {children}
    </a>
  );
};

const stripInlineMarkdown = (value) =>
  String(value || "")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~]/g, "")
    .replace(/<[^>]+>/g, "")
    .trim();

const BooksRules = () => {
  const [books, setBooks] = useState([]);
  const [content, setContent] = useState("");
  const [fontScale, setFontScale] = useState("md");
  const [widthMode, setWidthMode] = useState("comfort");
  const [focusMode, setFocusMode] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);
  const [listError, setListError] = useState("");
  const [contentError, setContentError] = useState("");
  const progressRef = useRef(null);
  const contentRef = useRef(null);
  const maxScrollRef = useRef(0);
  const progressValueRef = useRef(0);
  const headingSlugger = createSlugger();
  const { fileName } = useParams();
  const activeFileName = fileName || "";

  useEffect(() => {
    let isActive = true;
    setListError("");

    getMarkdownBooks()
      .then((res) => {
        if (!isActive) return;
        setBooks(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        if (!isActive) return;
        setListError("Failed to load the library.");
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!activeFileName) {
      setContent("");
      setContentError("");
      setLoadingContent(false);
      return;
    }
    const cached = getCachedBookContent(activeFileName);
    if (typeof cached === "string") {
      setContent(cached);
      setContentError("");
      setLoadingContent(false);
      return;
    }
    let isActive = true;
    setLoadingContent(true);
    setContent("");
    setContentError("");

    getMarkdownBookContent(activeFileName)
      .then((res) => {
        if (!isActive) return;
        const text = typeof res.data === "string" ? res.data : "";
        setContent(text);
        if (typeof text === "string") {
          setCachedBookContent(activeFileName, text);
        }
      })
      .catch(() => {
        if (!isActive) return;
        setContentError("Failed to load book content.");
      })
      .finally(() => {
        if (isActive) setLoadingContent(false);
      });

    return () => {
      isActive = false;
    };
  }, [activeFileName]);

  const scrollToTop = useCallback(() => {
    if (contentRef.current) {
      contentRef.current.scrollTo({ top: 0, behavior: "auto" });
    }
    if (progressRef.current) {
      progressRef.current.style.transform = "scaleX(0)";
      progressValueRef.current = 0;
    }
  }, []);

  useEffect(() => {
    if (!activeFileName) return;
    scrollToTop();
  }, [activeFileName, scrollToTop]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const updateMaxScroll = () => {
      maxScrollRef.current = Math.max(0, el.scrollHeight - el.clientHeight);
    };
    updateMaxScroll();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(() => updateMaxScroll());
      observer.observe(el);
      return () => observer.disconnect();
    }

    const onResize = () => updateMaxScroll();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [content]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    let rafId = null;
    const updateProgress = () => {
      const max = maxScrollRef.current;
      const ratio = max > 0 ? el.scrollTop / max : 0;
      const clamped = Math.max(0, Math.min(1, ratio));
      if (Math.abs(clamped - progressValueRef.current) < 0.002) return;
      progressValueRef.current = clamped;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${clamped})`;
      }
    };
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        updateProgress();
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (rafId) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, [content]);

  const activeBook = useMemo(
    () => books.find((book) => book.fileName === activeFileName),
    [books, activeFileName]
  );

  const tocItems = useMemo(() => {
    if (!content) return [];
    const next = [];
    const slugger = createSlugger();
    const lines = content.split("\n");
    let inFence = false;
    let fenceMarker = "";

    lines.forEach((line) => {
      const fenceMatch = line.match(/^(```+|~~~+)\s*/);
      if (fenceMatch) {
        const marker = fenceMatch[1][0];
        if (!inFence) {
          inFence = true;
          fenceMarker = marker;
        } else if (marker === fenceMarker) {
          inFence = false;
        }
        return;
      }

      if (inFence) return;

      const match = line.match(/^\s{0,3}(?:>+\s*)?(#{1,6})\s+(.+)/);
      if (!match) return;
      const level = match[1].length;
      const rawText = stripInlineMarkdown(match[2].trim().replace(/\s+#+$/, ""));
      const id = slugger(rawText);
      if (level <= 3) {
        next.push({
          id,
          level,
          text: rawText
        });
      }
    });

    return next;
  }, [content]);

  const lastUpdated = useMemo(() => {
    if (!activeBook?.lastModifiedUtc) return "";
    const date = new Date(activeBook.lastModifiedUtc);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }, [activeBook]);

  const wordCount = useMemo(() => {
    if (!content) return 0;
    return content.trim().split(/\s+/).filter(Boolean).length;
  }, [content]);

  const readTime = useMemo(() => {
    if (!wordCount) return "";
    const minutes = Math.max(1, Math.round(wordCount / 210));
    return `${minutes} min read`;
  }, [wordCount]);

  const metaLine = useMemo(() => {
    if (!activeFileName) return "Choose a book in the library.";
    const parts = [];
    if (lastUpdated) parts.push(`Updated ${lastUpdated}`);
    if (readTime) parts.push(readTime);
    return parts.length ? parts.join(" - ") : "Loading book details...";
  }, [activeFileName, lastUpdated, readTime]);

  const Heading = ({ level, children }) => {
    const text = stripInlineMarkdown(getNodeText(children));
    const id = headingSlugger(text);
    const Tag = `h${level}`;
    return <Tag id={id}>{children}</Tag>;
  };

  const Paragraph = ({ children }) => {
    const items = React.Children.toArray(children);
    const hasImage = items.some(
      (child) => React.isValidElement(child) && child.type === MarkdownImage
    );
    if (hasImage) {
      return <div className="books-rules-media-block">{children}</div>;
    }
    return <p>{children}</p>;
  };

  const markdownComponents = {
    h1: (props) => <Heading level={1} {...props} />,
    h2: (props) => <Heading level={2} {...props} />,
    h3: (props) => <Heading level={3} {...props} />,
    h4: (props) => <Heading level={4} {...props} />,
    h5: (props) => <Heading level={5} {...props} />,
    h6: (props) => <Heading level={6} {...props} />,
    img: MarkdownImage,
    p: Paragraph,
    a: MarkdownLink
  };

  const scrollToHeading = useCallback((id) => {
    const container = contentRef.current;
    if (!container || !id) return;
    const target = document.getElementById(id);
    if (!target || !container.contains(target)) return;
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const offset = targetRect.top - containerRect.top + container.scrollTop - 16;
    container.scrollTo({ top: offset, behavior: "auto" });
  }, []);

  const ContentSkeleton = () => (
    <div className="books-rules-skeleton">
      <div className="books-rules-skeleton-title" />
      <div className="books-rules-skeleton-line" />
      <div className="books-rules-skeleton-line" />
      <div className="books-rules-skeleton-line is-short" />
      <div className="books-rules-skeleton-subtitle" />
      <div className="books-rules-skeleton-line" />
      <div className="books-rules-skeleton-line" />
      <div className="books-rules-skeleton-line is-mid" />
      <div className="books-rules-skeleton-line" />
      <div className="books-rules-skeleton-line is-short" />
    </div>
  );

  return (
    <div
      className={`books-rules-page${focusMode ? " is-focus" : ""}`}
    >
      <header className="books-rules-topbar">
        <Link className="books-rules-back" to="/books">
          Back to Library
        </Link>
        <div className="books-rules-topbar-meta">
          <div className="books-rules-topbar-title">
            {activeBook?.title || activeFileName || "Rules Reader"}
          </div>
          <div className="books-rules-topbar-subtitle">
            {listError ? "Library unavailable." : metaLine}
          </div>
        </div>
        <div className="books-rules-controls">
          <div className="books-rules-control-group">
            <button
              className={`books-rules-button${fontScale === "sm" ? " is-active" : ""}`}
              type="button"
              onClick={() => setFontScale("sm")}
            >
              A-
            </button>
            <button
              className={`books-rules-button${fontScale === "md" ? " is-active" : ""}`}
              type="button"
              onClick={() => setFontScale("md")}
            >
              A
            </button>
            <button
              className={`books-rules-button${fontScale === "lg" ? " is-active" : ""}`}
              type="button"
              onClick={() => setFontScale("lg")}
            >
              A+
            </button>
          </div>
          <div className="books-rules-control-group">
            <button
              className={`books-rules-button${widthMode === "comfort" ? " is-active" : ""}`}
              type="button"
              onClick={() => setWidthMode("comfort")}
            >
              Comfort
            </button>
            <button
              className={`books-rules-button${widthMode === "wide" ? " is-active" : ""}`}
              type="button"
              onClick={() => setWidthMode("wide")}
            >
              Wide
            </button>
          </div>
          <button
            className={`books-rules-button${focusMode ? " is-active" : ""}`}
            type="button"
            onClick={() => setFocusMode((prev) => !prev)}
          >
            Focus
          </button>
        </div>
      </header>

      <div className="books-rules-layout">
        <aside className="books-rules-panel books-rules-toc-panel">
          <div className="books-rules-toc-header">
            <div className="books-rules-panel-title">Contents</div>
            <div className="books-rules-toc-count">{tocItems.length}</div>
          </div>
          {tocItems.length === 0 ? (
            <div className="books-rules-empty">
              {loadingContent
                ? "Loading contents..."
                : activeFileName
                  ? "No headings found in this book."
                  : "Choose a book in the library to see contents."}
            </div>
          ) : (
            <div className="books-rules-toc-list">
              {tocItems.map((item) => (
                <button
                  key={`${item.id}-${item.level}`}
                  type="button"
                  className={`books-rules-toc-item level-${item.level}`}
                  onClick={() => scrollToHeading(item.id)}
                >
                  {item.text}
                </button>
              ))}
            </div>
          )}
        </aside>

        <main className="books-rules-reader">
          <div className="books-rules-reader-card">
            <div className="books-rules-progress">
              <div className="books-rules-progress-bar" ref={progressRef} />
            </div>

            <div
              ref={contentRef}
              className={`books-rules-content size-${fontScale} width-${widthMode}`}
            >
              {!activeFileName ? (
                <div className="books-rules-empty">
                  <div>Choose a book to start reading.</div>
                  <Link className="books-rules-empty-link" to="/books">
                    Browse the library
                  </Link>
                </div>
              ) : loadingContent ? (
                <ContentSkeleton />
              ) : contentError ? (
                <div className="books-rules-error">{contentError}</div>
              ) : content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {content}
                </ReactMarkdown>
              ) : (
                <div className="books-rules-empty">Select a book to begin reading.</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default BooksRules;
