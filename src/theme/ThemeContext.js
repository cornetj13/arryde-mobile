import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from './colors';

/*
  Theme provider for the mobile app.

  Three modes:
    'system' (default) — follows the phone's own light/dark setting
    'light'            — always light
    'dark'             — always dark

  The choice is persisted, so it survives app restarts. Consumers use:

      const { colors } = useTheme();

  Naming the value `colors` is deliberate: inside a component it shadows the
  module-level `import { colors }`, so existing JSX that reads colors.gray[900]
  becomes theme-aware with no edits. Paired with the makeStyles(colors) pattern
  (see MIGRATION note below), a screen themes itself with a 3-line change.

  MIGRATION for a screen:
    1. const styles = StyleSheet.create({...})
         ->  const makeStyles = (colors) => StyleSheet.create({...})
    2. inside the component:
         const { colors } = useTheme();
         const styles = useMemo(() => makeStyles(colors), [colors]);
  Nothing inside the style bodies or the JSX has to change.
*/

const STORAGE_KEY = 'arryde-theme-mode';

const ThemeContext = createContext({
  colors: lightColors,
  mode: 'system',
  isDark: false,
  setMode: () => {},
});

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [mode, setModeState] = useState('system');
  const [hydrated, setHydrated] = useState(false);

  // Restore the saved preference once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (!cancelled && (saved === 'light' || saved === 'dark' || saved === 'system')) {
          setModeState(saved);
        }
      } catch {
        // Storage unavailable — fall back to 'system'.
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMode = useCallback((next) => {
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const isDark =
    mode === 'dark' || (mode === 'system' && systemScheme === 'dark');

  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      mode,
      isDark,
      setMode,
      hydrated,
    }),
    [isDark, mode, setMode, hydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
