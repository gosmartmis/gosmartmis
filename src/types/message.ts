export interface Message {
  id: string;
  school_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: 'student' | 'teacher';
  receiver_id: string;
  receiver_name: string;
  receiver_role: 'student' | 'teacher';
  subject: string;
  message_text: string;
  created_at: string;
  status: 'sent' | 'read' | 'blocked' | 'deleted';
  is_reply: boolean;
  parent_message_id?: string;
}

export interface Conversation {
  conversation_id: string;
  student_id: string;
  student_name: string;
  teacher_id: string;
  teacher_name: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  status: 'active' | 'blocked';
  messages: Message[];
}