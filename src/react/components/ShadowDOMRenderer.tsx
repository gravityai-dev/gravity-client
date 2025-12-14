import React from "react";
import { createRoot, Root } from "react-dom/client";

interface ShadowDOMWrapperProps {
  Component: React.ComponentType<any>;
  componentName: string;
  props: Record<string, any>;
  className?: string;
}

interface ShadowDOMWrapperState {}

/**
 * ShadowDOMWrapper - Renders components inside Shadow DOM for CSS isolation
 */
export class ShadowDOMWrapper extends React.Component<ShadowDOMWrapperProps, ShadowDOMWrapperState> {
  private containerRef: React.RefObject<HTMLDivElement>;
  private shadowRoot: ShadowRoot | null = null;
  private reactRoot: Root | null = null;

  constructor(props: ShadowDOMWrapperProps) {
    super(props);
    this.containerRef = React.createRef();
  }

  componentDidMount(): void {
    this.setupShadowDOM();
    this.renderComponent();
  }

  componentDidUpdate(prevProps: ShadowDOMWrapperProps): void {
    // Re-inject CSS if new components have been loaded
    this.updateCSS();

    if (prevProps.Component !== this.props.Component || prevProps.props !== this.props.props) {
      this.renderComponent();
    }
  }

  updateCSS(): void {
    if (!this.shadowRoot) return;

    // Get current CSS from global
    const allCSS = (window as any).__GRAVITY_COMPONENT_CSS__ || {};
    const cssNames = Object.keys(allCSS);

    // Check if we need to add new CSS
    const existingStyles = this.shadowRoot.querySelectorAll("style[data-component]");
    const existingComponents = Array.from(existingStyles).map((s) => s.getAttribute("data-component"));

    cssNames.forEach((name) => {
      if (!existingComponents.includes(name)) {
        const css = allCSS[name];
        if (css) {
          const style = document.createElement("style");
          style.textContent = css;
          style.setAttribute("data-component", name);
          this.shadowRoot!.appendChild(style);
        }
      }
    });
  }

  componentWillUnmount(): void {
    if (this.reactRoot) {
      try {
        this.reactRoot.unmount();
      } catch (err) {
        console.error("[ShadowDOM] Failed to unmount:", err);
      }
    }
  }

  setupShadowDOM(): void {
    if (!this.containerRef.current || this.shadowRoot) return;

    try {
      this.shadowRoot = this.containerRef.current.attachShadow({ mode: "open" });

      // Create container for React inside Shadow DOM
      // Use flex: 1 instead of height: 100% to work in flex parent context
      const reactContainer = document.createElement("div");
      reactContainer.className = "gravity-component";
      reactContainer.style.width = "100%";
      reactContainer.style.flex = "1";
      reactContainer.style.minHeight = "0";
      reactContainer.style.display = "flex";
      reactContainer.style.flexDirection = "column";
      this.shadowRoot.appendChild(reactContainer);

      // Inject CSS into Shadow DOM - inject ALL available CSS
      const allCSS = (window as any).__GRAVITY_COMPONENT_CSS__ || {};
      const cssNames = Object.keys(allCSS);

      cssNames.forEach((name) => {
        const css = allCSS[name];
        if (css) {
          const style = document.createElement("style");
          style.textContent = css;
          style.setAttribute("data-component", name);
          this.shadowRoot!.appendChild(style);
        }
      });

      // Create React root inside Shadow DOM
      this.reactRoot = createRoot(reactContainer);
    } catch (err) {
      console.error("[ShadowDOM] Failed to create Shadow DOM:", err);
    }
  }

  renderComponent(): void {
    if (!this.reactRoot) return;

    const { Component, props } = this.props;
    if (!Component) return;

    try {
      this.reactRoot.render(<Component {...props} />);
    } catch (err) {
      console.error("[ShadowDOM] Failed to render component:", err);
    }
  }

  render(): React.ReactNode {
    const { className = "" } = this.props;
    const isLayout = className.includes("layout");

    // For layouts: use flex: 1 to fill available space in flex parent
    // For components: use minHeight to ensure visibility
    const layoutStyle = isLayout
      ? { width: "100%", flex: 1, display: "flex", flexDirection: "column" as const, minHeight: 0 }
      : { width: "100%", height: "100%", minHeight: "200px" };

    return <div ref={this.containerRef} className={className} style={layoutStyle} />;
  }
}

export default ShadowDOMWrapper;
