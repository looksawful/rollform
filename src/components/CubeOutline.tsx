import type { Ref } from 'react';

export default function CubeOutline({ ref }: { ref?: Ref<SVGSVGElement> }) {
  return <svg ref={ref} viewBox="0 0 48 48" width="45" height="48" fill="none" stroke="currentColor"
    strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
    <path d="m24 5 17 10v20L24 45 7 35V15Z" />
    <path d="m7 15 17 10 17-10M24 25v20" />
  </svg>;
}
