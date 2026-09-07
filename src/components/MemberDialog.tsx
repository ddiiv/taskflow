'use client';

import { useState } from 'react';
import { createMember, deleteMember, updateMember } from '@/lib/actions';
import type { Member } from '@/lib/types';
import { ConfirmButton, Modal, SubmitButton } from './ui';

export default function MemberDialog({
  member,
  label,
  className = 'btn btn-primary',
}: {
  member?: Member;
  label: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(member);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>

      {open && (
        <Modal
          title={editing ? 'Editar persona' : 'Agregar persona'}
          onClose={() => setOpen(false)}
        >
          <form
            action={async (fd: FormData) => {
              if (editing) await updateMember(fd);
              else await createMember(fd);
              setOpen(false);
            }}
          >
            {member && <input type="hidden" name="id" value={member.id} />}
            <div className="modal-body">
              <div className="field">
                <label htmlFor="m-name">Nombre</label>
                <input
                  id="m-name"
                  className="input"
                  name="name"
                  required
                  autoFocus
                  maxLength={60}
                  placeholder="Ana Gómez"
                  defaultValue={member?.name}
                />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label htmlFor="m-email">Email</label>
                  <input
                    id="m-email"
                    className="input"
                    type="email"
                    name="email"
                    placeholder="ana@empresa.com"
                    defaultValue={member?.email ?? ''}
                  />
                </div>
                <div className="field">
                  <label htmlFor="m-role">Rol</label>
                  <input
                    id="m-role"
                    className="input"
                    name="role"
                    maxLength={40}
                    placeholder="Backend"
                    defaultValue={member?.role ?? ''}
                  />
                </div>
              </div>
            </div>
            <div className="modal-foot">
              <SubmitButton>{editing ? 'Guardar' : 'Agregar'}</SubmitButton>
            </div>
          </form>

          {member && (
            <form
              action={deleteMember}
              className="modal-foot"
              style={{ borderTop: 'none', paddingTop: 0 }}
            >
              <input type="hidden" name="id" value={member.id} />
              <span className="left" style={{ fontSize: 12, color: 'var(--muted)' }}>
                Sus tareas quedan sin asignar.
              </span>
              <ConfirmButton
                message={`¿Quitar a ${member.name} del equipo?`}
                className="btn btn-danger"
              >
                Quitar del equipo
              </ConfirmButton>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
