import { colors, fonts, spacing, radius } from '@/theme';
import * as themeNamespace from '@/theme/theme';

describe('Theme Tokens (TDD)', () => {
  it('contains essential color tokens for UI components', () => {
    expect(colors.background).toBeDefined();
    expect(colors.primary).toBeDefined();
    expect(colors.danger).toBeDefined();
    expect(colors.textPrimary).toBeDefined();
    expect(colors.textSecondary).toBeDefined();
    expect(colors.border).toBeDefined();
    expect(colors.teal).toBeDefined();
  });

  it('aligns backward-compatible aliases with semantic palette', () => {
    expect(colors.background).toBe(colors.bgPrimary);
    expect(colors.primary).toBe(colors.teal);
    expect(colors.danger).toBe('#ef4444');
  });

  it('contains typography and layout tokens', () => {
    expect(fonts.display).toBe('Outfit_700Bold');
    expect(fonts.body).toBe('Inter_400Regular');
    expect(spacing.md).toBe(12);
    expect(radius.md).toBe(12);
  });

  it('exports identical tokens via theme/theme re-export module', () => {
    expect(themeNamespace.colors).toEqual(colors);
    expect(themeNamespace.fonts).toEqual(fonts);
    expect(themeNamespace.spacing).toEqual(spacing);
    expect(themeNamespace.radius).toEqual(radius);
  });
});
