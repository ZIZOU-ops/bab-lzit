import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants/theme';

export function PriceDisplay({
  floorPrice,
  finalPrice,
}: {
  floorPrice: number;
  finalPrice?: number | null;
}) {
  const { t } = useTranslation();

  return (
    <View>
      <Text style={styles.price}>{finalPrice ?? floorPrice} MAD</Text>
      {finalPrice ? <Text style={styles.sub}>{t('orders.floor')}: {floorPrice} MAD</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  price: {
    color: colors.navy,
    fontFamily: 'Fraunces_700Bold',
    fontSize: 18,
  },
  sub: {
    color: colors.textMuted,
    fontFamily: 'DMSans_500Medium',
    fontSize: 10,
  },
});
