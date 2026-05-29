export const breakpoints = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1280
};

export function useBreakpoint(): 'mobile' | 'tablet' | 'desktop' | 'wide' {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  
  if (width < breakpoints.mobile) return 'mobile';
  if (width < breakpoints.tablet) return 'mobile';
  if (width < breakpoints.desktop) return 'tablet';
  if (width < breakpoints.wide) return 'desktop';
  return 'wide';
}

export function getResponsiveValue<T>(
  values: Partial<Record<'mobile' | 'tablet' | 'desktop' | 'wide', T>>,
  defaultValue: T
): T {
  const breakpoint = useBreakpoint();
  return values[breakpoint] ?? defaultValue;
}

export function responsiveFontSizes(baseSize: number): {
  mobile: number;
  tablet: number;
  desktop: number;
} {
  return {
    mobile: baseSize * 0.875,
    tablet: baseSize,
    desktop: baseSize * 1.125
  };
}

export function responsiveSpacing(baseSize: number): {
  mobile: number;
  tablet: number;
  desktop: number;
} {
  return {
    mobile: baseSize * 0.75,
    tablet: baseSize,
    desktop: baseSize * 1.25
  };
}