import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import CommercialScreen from '../src/screens/CommercialScreen';
import { StockValue } from '../src/components/StockValue';
export default function FinanceRoute() {
  const params = useLocalSearchParams();
  return params.section === 'stock' ? <StockValue /> : <CommercialScreen sectionOverride="sales" />;
}
