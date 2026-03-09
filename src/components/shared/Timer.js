import { useState, useEffect, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

const Timer = ({ startTime, style }) => {
  const [elapsed, setElapsed] = useState('0m 0s');
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!startTime) return;

    const start = new Date(startTime).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diffSeconds = Math.floor((now - start) / 1000);

      if (diffSeconds < 0) {
        setElapsed('0m 0s');
        return;
      }

      const hours = Math.floor(diffSeconds / 3600);
      const minutes = Math.floor((diffSeconds % 3600) / 60);
      const seconds = diffSeconds % 60;

      if (hours > 0) {
        setElapsed(`${hours}h ${minutes}m`);
      } else {
        setElapsed(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTime]);

  return <Text style={[styles.timer, style]}>{elapsed}</Text>;
};

const styles = StyleSheet.create({
  timer: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray[900],
    textAlign: 'center',
  },
});

export default Timer;
