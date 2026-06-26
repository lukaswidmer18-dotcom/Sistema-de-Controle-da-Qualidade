import { useState } from 'react'
import { Modal, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import { Feather } from '@expo/vector-icons'
import { useAuthStore } from '@/store/authStore'
import { getStatusColor, getStatusLabel } from '@/lib/utils'
import { BRAND_GREEN, BRAND_GOLD } from '@/lib/constants'

function StatusRow({ status, description }: { status: string; description: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.badge, { borderColor: getStatusColor(status), backgroundColor: `${getStatusColor(status)}1a` }]}>
        <Text style={[styles.badgeText, { color: getStatusColor(status) }]}>{getStatusLabel(status)}</Text>
      </View>
      <Text style={styles.rowText}>{description}</Text>
    </View>
  )
}

function Section({ title, adminOnly, children }: { title: string; adminOnly?: boolean; children: React.ReactNode }) {
  return (
    <View style={[styles.section, adminOnly && styles.sectionAdmin]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {adminOnly && (
          <View style={styles.adminTag}>
            <Text style={styles.adminTagText}>Só administrador</Text>
          </View>
        )}
      </View>
      <View style={{ gap: 10 }}>{children}</View>
    </View>
  )
}

export function MetricsGuideButton() {
  const [open, setOpen] = useState(false)
  const user = useAuthStore(s => s.user)
  const isAdmin = user?.role === 'ADMIN'

  if (!user) return null

  return (
    <>
      <Pressable onPress={() => setOpen(true)} style={styles.fab}>
        <Feather name="help-circle" size={26} color={BRAND_GOLD} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Guia de Métricas</Text>
              <Pressable onPress={() => setOpen(false)} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#6b7280" />
              </Pressable>
            </View>
            <Text style={styles.sheetSubtitle}>Como interpretar os status e cores do sistema</Text>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, gap: 12 }}>
              <Section title="Status do recebimento">
                <StatusRow status="CONFORME" description="Recebimento sem nenhuma não conformidade. Tudo certo." />
                <StatusRow status="NAO_CONFORME" description="Foi identificado item fora do padrão. Precisa de plano de ação." />
                <StatusRow status="APROVADO_RESSALVA" description="Recebido com ressalva, mas aprovado." />
                <StatusRow status="REPROVADO" description="Recebimento reprovado. Caso mais grave." />
                <StatusRow status="AGUARDANDO" description="Formulário aguardando finalização ou tratativa." />
              </Section>

              <Section title="Itens do checklist">
                <StatusRow status="CONFORME" description="Item dentro do esperado." />
                <StatusRow status="NAO_CONFORME" description="Item fora do padrão. Foto e observação ficam obrigatórias." />
                <Text style={styles.warnText}>⚠ Foto obrigatória: item crítico (termômetro, lacre, termógrafo) ou marcado Não Conforme. Não dá pra avançar sem ela.</Text>
              </Section>

              <Section title="Lista de PDFs Salvos">
                <Text style={styles.helperText}>O número em vermelho no card mostra quantas não conformidades aquele recebimento tem.</Text>
              </Section>

              <Section title="Planos de ação">
                <View style={styles.row}>
                  <View style={[styles.badge, { borderColor: '#fbbf24', backgroundColor: '#fffbeb' }]}>
                    <Text style={[styles.badgeText, { color: '#b45309' }]}>Pendente</Text>
                  </View>
                  <Text style={styles.rowText}>Não conformidade identificada, plano de ação ainda não registrado.</Text>
                </View>
                <View style={styles.row}>
                  <View style={[styles.badge, { borderColor: '#34d399', backgroundColor: '#ecfdf5' }]}>
                    <Text style={[styles.badgeText, { color: '#059669' }]}>Concluído</Text>
                  </View>
                  <Text style={styles.rowText}>Causa raiz e ação corretiva já registradas, PDF gerado e enviado.</Text>
                </View>
              </Section>

              {isAdmin && (
                <>
                  <Section title="Unidades e isolamento de dado" adminOnly>
                    <Text style={styles.rowText}>
                      Cada usuário Qualidade fica vinculado a uma unidade (Centro de Distribuição) e só vê recibos da própria
                      unidade. Administrador vê todas as unidades sem restrição.
                    </Text>
                    <Text style={styles.rowText}>
                      A unidade do recibo vem do campo Avaliador do formulário — não confundir com Avaliado, que é o
                      fornecedor/cliente inspecionado naquele recebimento.
                    </Text>
                  </Section>

                  <Section title="Perfis de usuário" adminOnly>
                    <View style={styles.row}>
                      <View style={[styles.badge, { borderColor: BRAND_GOLD, backgroundColor: `${BRAND_GOLD}1f` }]}>
                        <Text style={[styles.badgeText, { color: BRAND_GREEN }]}>Administrador</Text>
                      </View>
                      <Text style={styles.rowText}>Acesso total: todas as unidades, configurações, gestão de usuários.</Text>
                    </View>
                    <View style={styles.row}>
                      <View style={[styles.badge, { borderColor: BRAND_GREEN, backgroundColor: `${BRAND_GREEN}1a` }]}>
                        <Text style={[styles.badgeText, { color: BRAND_GREEN }]}>Qualidade</Text>
                      </View>
                      <Text style={styles.rowText}>Acesso restrito à própria unidade.</Text>
                    </View>
                  </Section>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: BRAND_GREEN,
    borderWidth: 1,
    borderColor: 'rgba(188,147,63,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: BRAND_GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 40,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { height: '85%', backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, paddingHorizontal: 18 },
  sheetTitle: { fontSize: 17, fontWeight: '800', color: BRAND_GREEN },
  sheetSubtitle: { fontSize: 13, color: '#6b7280', paddingHorizontal: 18, marginTop: 2 },
  closeBtn: { padding: 4 },
  section: { borderWidth: 1, borderColor: '#f3f4f6', borderRadius: 14, padding: 14, gap: 10 },
  sectionAdmin: { borderColor: 'rgba(188,147,63,0.35)', backgroundColor: 'rgba(188,147,63,0.03)' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: BRAND_GREEN },
  adminTag: { borderWidth: 1, borderColor: 'rgba(188,147,63,0.35)', backgroundColor: 'rgba(188,147,63,0.16)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  adminTagText: { fontSize: 10, fontWeight: '700', color: BRAND_GREEN },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  rowText: { flex: 1, fontSize: 13, color: '#4b5563', lineHeight: 18 },
  badge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3, marginTop: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  warnText: { fontSize: 12, color: '#dc2626', lineHeight: 17 },
  helperText: { fontSize: 13, color: '#4b5563', lineHeight: 18 },
})
