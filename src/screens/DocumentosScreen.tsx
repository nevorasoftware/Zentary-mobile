import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from 'react-native';
// @ts-ignore
import * as WebBrowser from 'expo-web-browser';
import { apiService } from '../services/api';

interface TenantDocument {
  id: string;
  title: string;
  url: string;
}

export const DocumentosScreen: React.FC = () => {
  const [documents, setDocuments] = useState<TenantDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await apiService.getDocuments();
      setDocuments(res.documents || []);
      setLoadError(false);
    } catch (e) {
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const openDocument = async (url: string) => {
    if (!/^https:\/\//i.test(url)) return;
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert('Error', 'No se pudo abrir el documento.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documentos</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#FFCF36" style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchDocuments();
              }}
              tintColor="#FFCF36"
            />
          }
        >
          {loadError ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No se pudieron cargar los documentos</Text>
              <Text style={styles.emptyText}>Revisa tu conexión e intenta de nuevo.</Text>
              <TouchableOpacity accessibilityRole="button" style={styles.retryBtn} onPress={() => fetchDocuments()}>
                <Text style={styles.retryBtnText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : documents.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Tu residencial aún no ha publicado documentos</Text>
            </View>
          ) : (
            documents.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                accessibilityRole="link"
                accessibilityLabel={`Abrir ${doc.title}`}
                style={styles.row}
                onPress={() => openDocument(doc.url)}
                activeOpacity={0.85}
              >
                <Text style={styles.rowTitle} numberOfLines={2}>{doc.title}</Text>
                <Text accessibilityElementsHidden importantForAccessibility="no" style={styles.chevron}>›</Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0F1F' },
  header: {
    minHeight: 80,
    backgroundColor: '#2A0A73',
    borderBottomWidth: 3,
    borderBottomColor: '#6203FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  content: { padding: 24 },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', backgroundColor: '#141A2E', borderRadius: 16, borderWidth: 1.5, borderColor: '#2A0A73', padding: 14, marginBottom: 10 },
  rowTitle: { flex: 1, color: '#FFFFFF', fontSize: 14, fontWeight: '800' },
  chevron: { color: '#FFCF36', fontSize: 24, fontWeight: '900', marginLeft: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', marginBottom: 6 },
  emptyText: { fontSize: 12, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 30 },
  retryBtn: { minHeight: 44, justifyContent: 'center', marginTop: 16, backgroundColor: '#1D6BE0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
});

export default DocumentosScreen;
