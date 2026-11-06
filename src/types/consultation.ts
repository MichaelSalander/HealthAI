export type DemoRole = 'customer' | 'consultant' | 'admin'
export interface DemoSession { id: string; role: DemoRole; name: string; token: string }
export interface HealthTimelineEvent { id: string; type: 'report' | 'report_review' | 'report_error' | 'observation'; title: string; status: string; detail: string; occurredAt: string }
export interface ConsultationSlot { id: string; startAt: string; capacity: number; remaining: number }
export interface ConsultationConsultant { id: string; name: string; level: string; categories?: string[]; phone?: string; intro?: string; status: 'available' | 'full' | 'offline'; freeConsultEnabled: boolean; dailyLimit: number; bookedCount: number; slots: ConsultationSlot[] }
export interface ConsultationRequest { id: string; userId: string; userName: string; consultantId: string; consultantName: string; slotId: string; slotStartAt: string; status: 'pending_assignment' | 'assigned' | 'accepted' | 'completed' | 'cancelled'; createdAt: string }
export interface ConsultationNotice { id: string; title: string; bookingId?: string; resourceType?: 'consultation_request' | 'conversation' | 'voice_session' | 'service_record'; resourceId?: string; read: boolean; createdAt: string }
export interface ConsultationPresence { userId: string; name: string; online: boolean; idle: boolean; lastSeenAt: string; lastActionAt: string }
export type ConsultationMode = 'immediate_text' | 'immediate_voice' | 'scheduled'
export type ConsultationRequestStatus = 'requested' | 'queued' | 'assigned' | 'waiting_consultant' | 'in_progress' | 'waiting_customer' | 'completed' | 'cancelled' | 'expired' | 'reassigned'
export interface ConsultationRequestV2 { id: string; requestId: string; userId: string; userName: string; serviceType: 'free_consult' | 'paid_service'; mode: ConsultationMode; consultantId?: string; consultantName?: string; status: ConsultationRequestStatus; createdAt: string; assignedAt?: string; acceptedAt?: string; conversationId?: string; }
export type MessageType = 'text' | 'system' | 'voice_event'
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
export interface ConsultationMessage { id: string; conversationId: string; senderId: string; senderRole: DemoRole; senderName: string; type: MessageType; content: string; clientMessageId?: string; status: MessageStatus; sentAt: string; readAt?: string }
export type VoiceSessionStatus = 'idle' | 'calling' | 'connected' | 'ended' | 'failed'
export interface VoiceSession { id: string; conversationId: string; initiatorId: string; status: VoiceSessionStatus; startedAt?: string; connectedAt?: string; endedAt?: string; durationSec?: number; failureCode?: string }
export interface ConsultationParticipant { userId: string; role: DemoRole; name: string; online: boolean; lastSeenAt?: string; lastReadMessageId?: string }
export interface ConsultationRoom { id: string; consultationRequestId: string; userId: string; userName: string; consultantId: string; consultantName: string; status: 'waiting' | 'in_progress' | 'completed'; startedAt?: string; endedAt?: string; participants: ConsultationParticipant[]; lastMessageAt?: string }
export interface ServiceRecord { id: string; conversationId: string; consultationRequestId: string; userId: string; consultantId: string; summary: string; followUpItems: string[]; durationSec: number; createdAt: string }
export const bookingStatusLabels: Record<ConsultationRequest['status'], string> = { pending_assignment: '待派单', assigned: '已配对，待确认', accepted: '咨询中', completed: '已完成', cancelled: '已取消' }
export const availabilityLabels = { available: '可预约', full: '已额满', offline: '离线' }
