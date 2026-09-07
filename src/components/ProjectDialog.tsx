'use client';

import { useState } from 'react';
import { createProject, deleteProject, updateProject } from '@/lib/actions';
import type { Member, Project } from '@/lib/types';
import { ConfirmButton, Modal, SubmitButton } from './ui';

export default function ProjectDialog({
  members,
  project,
  label,
  className = 'btn btn-primary',
}: {
  members: Member[];
  project?: Project;
  label: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(project);

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {label}
      </button>

      {open && (
        <Modal
          title={editing ? 'Editar proyecto' : 'Nuevo proyecto'}
          onClose={() => setOpen(false)}
        >
          <form
            action={
              editing
                ? async (fd: FormData) => {
                    await updateProject(fd);
                    setOpen(false);
                  }
                : createProject
            }
          >
            {project && <input type="hidden" name="id" value={project.id} />}
            <div className="modal-body">
              <div className="field">
                <label htmlFor="p-name">Nombre</label>
                <input
                  id="p-name"
                  className="input"
                  name="name"
                  required
                  autoFocus
                  maxLength={80}
                  placeholder="Rediseño del sitio"
                  defaultValue={project?.name}
                />
              </div>

              {!editing && (
                <div className="field">
                  <label htmlFor="p-key">Clave (opcional)</label>
                  <input
                    id="p-key"
                    className="input"
                    name="key"
                    maxLength={6}
                    placeholder="WEB"
                    style={{ textTransform: 'uppercase', maxWidth: 140 }}
                  />
                  <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>
                    Prefijo de las tareas: WEB-1, WEB-2… Si lo dejás vacío se
                    genera desde el nombre.
                  </span>
                </div>
              )}

              <div className="field">
                <label htmlFor="p-lead">Responsable del proyecto</label>
                <select
                  id="p-lead"
                  className="select"
                  name="lead_id"
                  defaultValue={project?.lead_id ?? ''}
                >
                  <option value="">Sin asignar</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="p-desc">Descripción</label>
                <textarea
                  id="p-desc"
                  className="textarea"
                  name="description"
                  placeholder="Objetivo, alcance, notas…"
                  defaultValue={project?.description ?? ''}
                />
              </div>
            </div>

            <div className="modal-foot">
              <SubmitButton>
                {editing ? 'Guardar cambios' : 'Crear proyecto'}
              </SubmitButton>
            </div>
          </form>

          {project && (
            <form
              action={deleteProject}
              className="modal-foot"
              style={{ borderTop: 'none', paddingTop: 0 }}
            >
              <input type="hidden" name="id" value={project.id} />
              <span
                className="left"
                style={{ fontSize: 12, color: 'var(--muted)' }}
              >
                Eliminar borra también todas sus tareas.
              </span>
              <ConfirmButton
                message={`¿Eliminar "${project.name}" y todas sus tareas?`}
                className="btn btn-danger"
              >
                Eliminar proyecto
              </ConfirmButton>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
