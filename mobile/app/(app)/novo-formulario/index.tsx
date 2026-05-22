import { useEffect, useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, Modal, FlatList,
} from 'react-native'
import { router, Stack } from 'expo-router'
import { useFormStore } from '@/store/formStore'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { BRAND_GREEN, BRAND_GOLD, BRAND_CREAM, HAIRLINE_GREEN, VEHICLE_TYPES } from '@/lib/constants'
import { PhotoCapture } from '@/components/form/PhotoCapture'
import { PhotoData } from '@/lib/types'

interface EmailList { id: string; name: string; emails: string[] }

export default function Step1Identificacao() {
  const { form, updateField, updateProduct, addProduct, removeProduct, setPlatePicture, restore, reset } = useFormStore()
  const user = useAuthStore(s => s.user)
  const [showVehicleTypes, setShowVehicleTypes] = useState(false)
  const [showEvaluators, setShowEvaluators] = useState(false)

  const { data: emailLists } = useQuery<EmailList[]>({
    queryKey: ['email-lists'],
    queryFn: async () => {
      const res = await api.get<EmailList[]>('/api/email-lists')
      return res.data
    },
  })

  useEffect(() => {
    void restore().then(restored => {
    if (restored) {
      Alert.alert(
        'Rascunho encontrado',
        'Existe um formulário em andamento. Continuar ou iniciar novo?',
        [
          { text: 'Continuar', style: 'default' },
          { text: 'Novo formulário', style: 'destructive', onPress: reset },
        ]
      )
    }
    // Pre-fill quality responsible from logged user
    if (!form.qualityResponsible && user?.name) {
      updateField('qualityResponsible', user.name)
    }
    })
  }, [])

  const canProceed = () => {
    if (!form.evaluatorName) return false
    if (!form.qualityResponsible) return false
    if (!form.operationResponsible) return false
    if (!form.receivingOrder) return false
    if (!form.invoiceNumber) return false
    if (!form.vehicleType) return false
    if (!form.trailerPlate) return false
    if (form.products.length === 0) return false
    if (form.products.some(p => !p.productCode || !p.lot)) return false
    return true
  }

  const proceed = () => {
    if (!canProceed()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos marcados com *')
      return
    }
    router.push('/(app)/novo-formulario/veiculo')
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Passo 1 — Identificação' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Step indicator */}
        <View style={styles.stepBar}>
          {['1', '2', '3', '4', '5', '6'].map((s, i) => (
            <View key={s} style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, i === 0 && styles.stepDotTextActive]}>{s}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Identificação</Text>

        {/* Evaluator */}
        <View style={styles.field}>
          <Text style={styles.label}>Avaliador <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.evaluatorName}
            onChangeText={v => updateField('evaluatorName', v)}
            placeholder="Nome do avaliador"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Email list */}
        {emailLists && emailLists.length > 0 && (
          <View style={styles.field}>
            <Text style={styles.label}>Lista de E-mail</Text>
            <TouchableOpacity
              style={styles.selectBtn}
              onPress={() => setShowEvaluators(true)}
            >
              <Text style={styles.selectText}>
                {emailLists.find(l => l.id === form.evaluatorEmailListId)?.name ?? 'Selecionar lista...'}
              </Text>
              <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quality responsible */}
        <View style={styles.field}>
          <Text style={styles.label}>Resp. Qualidade <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.qualityResponsible}
            onChangeText={v => updateField('qualityResponsible', v)}
            placeholder="Nome do responsável"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Operation responsible */}
        <View style={styles.field}>
          <Text style={styles.label}>Resp. Operação <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.operationResponsible}
            onChangeText={v => updateField('operationResponsible', v)}
            placeholder="Nome do responsável operação"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Receiving order */}
        <View style={styles.field}>
          <Text style={styles.label}>Ordem de Recebimento <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.receivingOrder}
            onChangeText={v => updateField('receivingOrder', v)}
            placeholder="Ex: OR-2024-001"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Invoice */}
        <View style={styles.field}>
          <Text style={styles.label}>Nota Fiscal <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={form.invoiceNumber}
            onChangeText={v => updateField('invoiceNumber', v)}
            placeholder="Número da NF"
            placeholderTextColor="#9ca3af"
            keyboardType="default"
          />
        </View>

        {/* Vehicle type */}
        <View style={styles.field}>
          <Text style={styles.label}>Tipo de Veículo <Text style={styles.req}>*</Text></Text>
          <TouchableOpacity style={styles.selectBtn} onPress={() => setShowVehicleTypes(true)}>
            <Text style={styles.selectText}>{form.vehicleType || 'Selecionar tipo...'}</Text>
            <Text style={styles.chevron}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Trailer plate */}
        <View style={styles.field}>
          <Text style={styles.label}>Placa do Veículo <Text style={styles.req}>*</Text></Text>
          <TextInput
            style={[styles.input, { textTransform: 'uppercase' }]}
            value={form.trailerPlate}
            onChangeText={v => updateField('trailerPlate', v.toUpperCase())}
            placeholder="AAA-0000"
            placeholderTextColor="#9ca3af"
            autoCapitalize="characters"
          />
        </View>

        {/* Plate picture */}
        <View style={styles.field}>
          <Text style={styles.label}>Foto da Placa</Text>
          <PhotoCapture
            photos={form.platePicture ? [form.platePicture] : []}
            onAdd={photo => setPlatePicture(photo)}
            onUpdate={(_, photo) => setPlatePicture({ ...form.platePicture, ...photo } as PhotoData)}
            maxPhotos={1}
          />
        </View>

        {/* Products */}
        <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Produtos e Lotes</Text>
        {form.products.map((product, i) => (
          <View key={product.id} style={styles.productCard}>
            <View style={styles.productHeader}>
              <Text style={styles.productIndex}>Produto {i + 1}</Text>
              {form.products.length > 1 && (
                <TouchableOpacity onPress={() => removeProduct(product.id)}>
                  <Text style={styles.removeText}>Remover</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              value={product.productCode}
              onChangeText={v => updateProduct(product.id, 'productCode', v)}
              placeholder="Código do produto *"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={[styles.input, { marginTop: 8 }]}
              value={product.productDescription ?? ''}
              onChangeText={v => updateProduct(product.id, 'productDescription', v)}
              placeholder="Descrição"
              placeholderTextColor="#9ca3af"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={product.lot}
                onChangeText={v => updateProduct(product.id, 'lot', v)}
                placeholder="Lote *"
                placeholderTextColor="#9ca3af"
              />
              <TextInput
                style={[styles.input, { flex: 1, marginLeft: 8 }]}
                value={product.quantity ?? ''}
                onChangeText={v => updateProduct(product.id, 'quantity', v)}
                placeholder="Qtd."
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addProductBtn} onPress={addProduct}>
          <Text style={styles.addProductText}>+ Adicionar produto</Text>
        </TouchableOpacity>

        {/* Observations */}
        <View style={styles.field}>
          <Text style={styles.label}>Observações</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
            value={form.observations ?? ''}
            onChangeText={v => updateField('observations', v)}
            placeholder="Observações gerais..."
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={proceed}
          disabled={!canProceed()}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>Próximo →</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Vehicle type picker */}
      <Modal visible={showVehicleTypes} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Tipo de Veículo</Text>
            <FlatList
              data={VEHICLE_TYPES}
              keyExtractor={v => v}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => { updateField('vehicleType', item); setShowVehicleTypes(false) }}
                >
                  <Text style={[styles.modalItemText, form.vehicleType === item && { color: BRAND_GREEN, fontWeight: '700' }]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowVehicleTypes(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Email list picker */}
      {emailLists && (
        <Modal visible={showEvaluators} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <Text style={styles.modalTitle}>Lista de E-mail</Text>
              <FlatList
                data={emailLists}
                keyExtractor={l => l.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.modalItem}
                    onPress={() => { updateField('evaluatorEmailListId', item.id); setShowEvaluators(false) }}
                  >
                    <Text style={[styles.modalItemText, form.evaluatorEmailListId === item.id && { color: BRAND_GREEN, fontWeight: '700' }]}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowEvaluators(false)}>
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BRAND_CREAM },
  content: { padding: 14, paddingBottom: 132 },
  stepBar: {
    flexDirection: 'row', gap: 6, justifyContent: 'center',
    marginBottom: 16,
  },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: BRAND_GREEN },
  stepDotText: { fontSize: 12, fontWeight: '700', color: '#6b7280' },
  stepDotTextActive: { color: '#fff' },
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: BRAND_GREEN,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10,
  },
  field: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  req: { color: '#ef4444' },
  input: {
    height: 48, borderWidth: 1, borderColor: '#d8ddd6',
    borderRadius: 8, paddingHorizontal: 12, fontSize: 14,
    color: '#111827', backgroundColor: '#fff',
  },
  selectBtn: {
    height: 48, borderWidth: 1, borderColor: '#d8ddd6',
    borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#fff',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  selectText: { fontSize: 14, color: '#374151' },
  chevron: { fontSize: 10, color: '#9ca3af' },
  row: { flexDirection: 'row', marginTop: 8 },
  productCard: {
    backgroundColor: '#fff', borderRadius: 8, padding: 12,
    marginBottom: 10, borderWidth: 1, borderColor: HAIRLINE_GREEN,
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  productHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  productIndex: { fontSize: 13, fontWeight: '700', color: BRAND_GREEN },
  removeText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
  addProductBtn: {
    minHeight: 48, borderWidth: 1.5, borderColor: BRAND_GOLD, borderStyle: 'dashed',
    borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  addProductText: { color: BRAND_GREEN, fontWeight: '700', fontSize: 14 },
  nextBtn: {
    backgroundColor: BRAND_GREEN, borderRadius: 8, height: 54,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
    shadowColor: BRAND_GREEN, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.30, shadowRadius: 8, elevation: 6,
  },
  nextBtnDisabled: {
    backgroundColor: '#93a39f',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '70%',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: BRAND_GREEN, marginBottom: 12 },
  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  modalItemText: { fontSize: 15, color: '#374151' },
  modalCancel: { marginTop: 12, alignItems: 'center', padding: 12 },
  modalCancelText: { color: '#ef4444', fontWeight: '700', fontSize: 15 },
})
