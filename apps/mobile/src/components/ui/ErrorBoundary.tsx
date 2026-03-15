import React, { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, textStyles } from '../../constants/theme';
import i18n from '../../lib/i18n';
import { Button } from './Button';

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message: string;
};

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Route ErrorBoundary caught an error', error, info);
  }

  reset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>{i18n.t('errors.unexpected')}</Text>
          <Text style={styles.message}>{this.state.message || i18n.t('errors.unknown')}</Text>
          <Button variant="outline" label={i18n.t('common.retry')} onPress={this.reset} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
    gap: 12,
  },
  title: {
    ...textStyles.h1,
    color: colors.navy,
  },
  message: {
    ...textStyles.body,
    color: colors.textSec,
    textAlign: 'center',
  },
});
