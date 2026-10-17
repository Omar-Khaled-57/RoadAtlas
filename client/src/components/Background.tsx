export function Background() {
  return (
    <div className="app-background" aria-hidden="true">
      <div className="app-background__stage">
        <span className="blob blob-one" />
        <span className="blob blob-two" />
        <span className="blob blob-three" />
        <span className="blob blob-four" />
      </div>
      <span className="app-background__veil" />
      <span className="app-background__grid" />
    </div>
  );
}
