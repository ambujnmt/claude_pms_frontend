import api from './api';

export const DOC_CATEGORIES = ['Requirement', 'Design', 'Contract', 'Invoice', 'Report', 'Other'];
export const FINANCE_DOC_CATEGORIES = ['Contract', 'Invoice'];
export const MAX_DOC_MB = 10;
export const ALLOWED_EXT = ['pdf','doc','docx','xls','xlsx','ppt','pptx','csv','txt','png','jpg','jpeg','webp','gif','zip','fig','sketch'];

const documentService = {
  getAll: async (projectId) => {
    const { data } = await api.get(`/projects/${projectId}/documents`);
    return data.data;
  },

  upload: async (projectId, files, category, onProgress) => {
    const fd = new FormData();
    files.forEach(f => fd.append('files[]', f));
    fd.append('category', category || 'Other');
    const { data } = await api.post(`/projects/${projectId}/documents`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => onProgress && e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
    });
    return data.data;
  },

  /* Files are private: fetch with the auth header as a blob, then hand it to the browser */
  download: async (projectId, doc) => {
    const res = await api.get(`/projects/${projectId}/documents/${doc.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url; a.download = doc.name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  },

  delete: async (projectId, id) => {
    await api.delete(`/projects/${projectId}/documents/${id}`);
  },
};

export default documentService;
