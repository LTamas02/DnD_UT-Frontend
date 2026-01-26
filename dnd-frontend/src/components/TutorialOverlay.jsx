import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../assets/styles/TutorialOverlay.css";

const buildSteps = (username) => [
  {
    title: `Welcome${username ? `, ${username}` : ""}`,
    description:
      "This quick tour shows you the main areas of the app. You can click through or skip any time.",
    path: "/",
    target: "nav-home",
    actionLabel: "Go to Home"
  },
  {
    title: "Characters",
    description: "Create and manage heroes, track sheets, and spawn tokens in the VTT.",
    path: "/characters",
    target: "nav-characters",
    actionLabel: "Open Characters"
  },
  {
    title: "DM Tools",
    description: "Plan encounters, NPCs, loot, and maps from one toolbox.",
    path: "/dmtools",
    target: "nav-dmtools",
    actionLabel: "Open DM Tools"
  },
  {
    title: "Virtual Tabletop",
    description: "Run sessions with maps, tokens, dice, chat, and live tools.",
    path: "/vtt",
    actionLabel: "Open VTT"
  },
  {
    title: "Books & Rules",
    description: "Browse the library and open rulebooks with images and tables.",
    path: "/books",
    target: "nav-books",
    actionLabel: "Open Books"
  },
  {
    title: "Wiki",
    description: "Search spells, classes, monsters, items, and more.",
    path: "/wiki",
    target: "nav-wiki",
    actionLabel: "Open Wiki"
  },
  {
    title: "Friends & Profile",
    description: "Manage friends, update your profile, and personalize the theme.",
    path: "/friends",
    actionLabel: "Open Friends"
  },
  {
    title: "Profile",
    description: "Tune your theme, update your picture, and review your details.",
    path: "/profile",
    target: "nav-profile",
    actionLabel: "Open Profile"
  }
];

export default function TutorialOverlay({
  isAuthenticated,
  username,
  hasCompletedTutorial = true,
  onComplete
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const steps = useMemo(() => buildSteps(username), [username]);
  const totalSteps = steps.length;
  const activeStep = steps[stepIndex] || steps[0];
  const targetRef = useRef(null);
  const hasTarget = Boolean(targetRect);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsOpen(false);
      return;
    }

    if (!hasCompletedTutorial) {
      setIsOpen(true);
      setStepIndex(0);
    }
  }, [isAuthenticated, hasCompletedTutorial]);

  useEffect(() => {
    const handleManualStart = () => {
      if (!isAuthenticated) return;
      setStepIndex(0);
      setIsOpen(true);
    };

    window.addEventListener("tutorial:start", handleManualStart);
    return () => {
      window.removeEventListener("tutorial:start", handleManualStart);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const resolveTarget = () => {
      if (typeof document === "undefined") return;
      if (!activeStep?.target) {
        targetRef.current = null;
        setTargetRect(null);
        return;
      }
      const element = document.querySelector(
        `[data-tutorial="${activeStep.target}"]`
      );
      if (!element) {
        targetRef.current = null;
        setTargetRect(null);
        return;
      }
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        targetRef.current = null;
        setTargetRect(null);
        return;
      }
      targetRef.current = element;
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    };

    resolveTarget();
    window.addEventListener("resize", resolveTarget);
    window.addEventListener("scroll", resolveTarget, true);
    return () => {
      window.removeEventListener("resize", resolveTarget);
      window.removeEventListener("scroll", resolveTarget, true);
    };
  }, [activeStep, isOpen, location.pathname]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsOpen(false);
    onComplete?.();
  };

  const handleNext = () => {
    if (stepIndex >= totalSteps - 1) {
      handleClose();
      return;
    }
    setStepIndex((prev) => prev + 1);
  };

  const handleBack = () => {
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleVisit = () => {
    if (targetRef.current) {
      targetRef.current.click();
      return;
    }
    if (!activeStep?.path) return;
    if (location.pathname !== activeStep.path) {
      navigate(activeStep.path);
    }
  };

  if (!isOpen || !isAuthenticated) return null;

  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 768;
  const placement =
    targetRect && targetRect.top > viewportHeight * 0.55 ? "above" : "below";
  const calloutWidth = 360;
  const calloutPadding = 16;
  const clampedLeft = targetRect
    ? Math.min(
        Math.max(targetRect.left, calloutPadding),
        Math.max(calloutPadding, viewportWidth - calloutWidth - calloutPadding)
      )
    : 0;

  const calloutStyle = targetRect
    ? {
        top:
          placement === "above"
            ? targetRect.top - 12
            : targetRect.top + targetRect.height + 12,
        left: clampedLeft,
        transform: placement === "above" ? "translateY(-100%)" : "translateY(0)"
      }
    : undefined;

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true">
      <div className="tutorial-scrim" />
      {hasTarget && (
        <button
          type="button"
          className="tutorial-highlight"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height
          }}
          onClick={handleVisit}
          aria-label={`Open ${activeStep.title}`}
        >
          <span className="tutorial-highlight-label">Click here</span>
        </button>
      )}
      <div
        className={`tutorial-card ${hasTarget ? "is-anchored" : ""}`}
        style={calloutStyle}
        data-placement={placement}
      >
        <div className="tutorial-header">
          <div className="tutorial-badge">Tutorial</div>
          <div className="tutorial-progress">
            Step {stepIndex + 1} of {totalSteps}
          </div>
        </div>
        <h2 className="tutorial-title">{activeStep.title}</h2>
        <p className="tutorial-description">{activeStep.description}</p>
        {hasTarget && (
          <div className="tutorial-hint">
            Click the highlighted link or use the button below.
          </div>
        )}
        {activeStep.path && (
          <button className="tutorial-link" type="button" onClick={handleVisit}>
            {location.pathname === activeStep.path
              ? "You are here"
              : activeStep.actionLabel || "Open page"}
          </button>
        )}
        <div className="tutorial-dots">
          {steps.map((_, index) => (
            <span
              key={`dot-${index}`}
              className={`tutorial-dot ${index === stepIndex ? "is-active" : ""}`}
            />
          ))}
        </div>
        <div className="tutorial-actions">
          <button className="tutorial-button ghost" type="button" onClick={handleClose}>
            Skip tutorial
          </button>
          <div className="tutorial-nav">
            <button
              className="tutorial-button ghost"
              type="button"
              onClick={handleBack}
              disabled={stepIndex === 0}
            >
              Back
            </button>
            <button className="tutorial-button primary" type="button" onClick={handleNext}>
              {stepIndex >= totalSteps - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

