export default function PreviewPage() {
  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Preview en Vivo</h1>
          <p className="text-secondary/60">Visualización de la página de Proyectos para corroborar modificaciones sin salir del panel.</p>
        </div>
        <a href="/proyectos" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-secondary text-white rounded-lg text-sm font-semibold hover:bg-secondary/90 transition-colors">
          Tab Nueva
        </a>
      </div>
      
      <div className="flex-1 bg-white rounded-2xl border border-border shadow-sm overflow-hidden relative isolate">
        <iframe src="/proyectos" className="w-full h-full border-none outline-none ring-0 pointer-events-auto bg-white" title="Live Preview"></iframe>
      </div>
    </div>
  );
}
