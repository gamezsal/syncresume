import { create } from 'zustand';

interface LayoutState {
  activeProjectSlug: string | null;
  isTransitioning: boolean;
  setActiveProjectSlug: (slug: string | null) => void;
  setTransitioning: (state: boolean) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  activeProjectSlug: null,
  isTransitioning: false,
  setActiveProjectSlug: (slug) => set({ activeProjectSlug: slug }),
  setTransitioning: (state) => set({ isTransitioning: state }),
}));
