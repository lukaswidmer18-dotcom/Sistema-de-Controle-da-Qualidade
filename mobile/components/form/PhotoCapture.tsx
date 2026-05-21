import { useState } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import api from '@/lib/api'
import { PhotoData } from '@/lib/types'
import { BRAND_GREEN, BRAND_GOLD } from '@/lib/constants'

interface Props {
  photos: PhotoData[]
  onAdd: (photo: PhotoData) => void
  onUpdate: (index: number, photo: Partial<PhotoData>) => void
  maxPhotos?: number
  label?: string
}

export function PhotoCapture({ photos, onAdd, onUpdate, maxPhotos = 5, label }: Props) {
  const [picking, setPicking] = useState(false)

  const requestAndPick = async (source: 'camera' | 'gallery') => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita acesso à câmera nas configurações')
        return
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Permita acesso à galeria nas configurações')
        return
      }
    }

    setPicking(true)
    try {
      const result = source === 'camera'
        ? await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsMultipleSelection: false })

      if (result.canceled || !result.assets?.[0]) return

      const asset = result.assets[0]
      const previewUri = asset.uri
      const fileName = asset.fileName ?? `photo_${Date.now()}.jpg`
      const fileType = asset.mimeType ?? 'image/jpeg'

      const placeholder: PhotoData = {
        fileUrl: '',
        fileName,
        fileType,
        previewUri,
        uploading: true,
      }

      onAdd(placeholder)
      const photoIndex = photos.length

      // Upload
      const formData = new FormData()
      formData.append('file', { uri: previewUri, name: fileName, type: fileType } as unknown as Blob)

      const uploadRes = await api.post<{ fileUrl: string; fileName: string; fileType: string }>(
        '/api/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      onUpdate(photoIndex, {
        fileUrl: uploadRes.data.fileUrl,
        fileName: uploadRes.data.fileName,
        uploading: false,
        error: false,
      })
    } catch {
      const photoIndex = photos.length
      onUpdate(photoIndex, { uploading: false, error: true })
      Alert.alert('Erro', 'Falha ao fazer upload da foto. Tente novamente.')
    } finally {
      setPicking(false)
    }
  }

  const showPicker = () => {
    Alert.alert('Adicionar foto', 'Escolha a origem', [
      { text: 'Câmera', onPress: () => requestAndPick('camera') },
      { text: 'Galeria', onPress: () => requestAndPick('gallery') },
      { text: 'Cancelar', style: 'cancel' },
    ])
  }

  const canAddMore = photos.length < maxPhotos

  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}

      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosRow}>
          {photos.map((photo, i) => (
            <View key={i} style={styles.photoThumb}>
              <Image
                source={{ uri: photo.previewUri || photo.fileUrl }}
                style={styles.thumbImage}
              />
              {photo.uploading && (
                <View style={styles.thumbOverlay}>
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}
              {photo.error && (
                <View style={[styles.thumbOverlay, { backgroundColor: 'rgba(220,38,38,0.6)' }]}>
                  <Text style={{ color: '#fff', fontSize: 11 }}>Erro</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {canAddMore && (
        <TouchableOpacity
          style={[styles.addButton, picking && styles.addButtonDisabled]}
          onPress={showPicker}
          disabled={picking}
          activeOpacity={0.75}
        >
          {picking ? (
            <ActivityIndicator color={BRAND_GREEN} size="small" />
          ) : (
            <>
              <Text style={styles.addIcon}>📷</Text>
              <Text style={styles.addText}>
                {photos.length === 0 ? 'Adicionar foto' : 'Mais foto'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  photosRow: {
    marginBottom: 8,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 8,
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: BRAND_GOLD,
    borderStyle: 'dashed',
    alignSelf: 'flex-start',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addIcon: {
    fontSize: 14,
  },
  addText: {
    fontSize: 13,
    fontWeight: '600',
    color: BRAND_GREEN,
  },
})
