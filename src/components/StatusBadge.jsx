import React from 'react';

const MAP = {
  'Novo': 'b-novo', 'Enviado': 'b-enviado', 'Entregue': 'b-entregue',
  'Cancelado': 'b-cancelado', 'Cancelada': 'b-cancelado',
  'Rascunho': 'b-rascunho', 'Aprovado': 'b-aprovado',
  'Rejeitado': 'b-rejeitado', 'Expirado': 'b-expirado',
  'Pago': 'b-pago', 'Pendente': 'b-pendente', 'Atrasado': 'b-atrasado',
  'Emitida': 'b-emitida', 'Ativo': 'b-ativo', 'Inativo': 'b-inativo',
  'Em Processamento': 'b-processando',
};

export default function StatusBadge({ status }) {
  return <span className={`badge ${MAP[status] || 'b-novo'}`}>{status}</span>;
}