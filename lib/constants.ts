/**
 * @deprecated Use lib/preferences.ts instead for category configuration.
 * This file is kept for backward compatibility.
 */

import { CATEGORY_ICONS, getCategoryIconName as getIconName, getIconComponent } from './preferences';

// Re-export for backward compatibility
export const ICON_MAP = CATEGORY_ICONS;

// Wrapper for backward compatibility
export const getCategoryIconName = getIconName;

// Export the new icon component getter
export { getIconComponent };
