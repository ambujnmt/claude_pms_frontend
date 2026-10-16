import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, Badge, Btn, Field, inputStyle, ConfirmModal, EmptyState } from './UI';
import { UploadCloud, FileText, Image as ImageIcon, FileSpreadsheet, FileArchive, File, Download, Trash2 } from 'lucide-react';
import documentService, { DOC_CATEGORIES, FINANCE_DOC_CATEGORIES, MAX_DOC_MB, ALLOWED_EXT } from '../services/documentService';

const CAT_COLOR = { Requirement:'#2E6DB4', Design:'#4C3A9E', Contract:'#1A6B3C', Invoice:'#8B5E0A', Report:'#A85010', Other:'#6B7A99' };

const ext = (n) => (n.split('.').pop() || '').toLowerCase();
function FileIcon({ name }) {
  const e = ext(name);
  const P = { size: 18 };
  if (['png','jpg','jpeg','webp','gif'].includes(e)) return <ImageIcon {...P} color="#4C3A9E"/>;
  if (['xls','xlsx','csv'].includes(e))              return <FileSpreadsheet {...P} color="#1A6B3C"/>;
  if (['zip'].includes(e))                            return <FileArchive {...P} color="#8B5E0A"/>;
  if (['pdf','doc','docx','ppt','pptx','txt'].includes(e)) return <FileText {...P} color="#2E6DB4"/>;
  return <File {...P} color="#6B7A99"/>;
}
const size = (b) => b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;
const when = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';

/* Files attached to a project. Private storage; downloads are authenticated.
 * canManage: may upload contracts/invoices + delete anything. Others: upload everything except
 * Contract/Invoice, delete only their own uploads. */
export default function ProjectDocuments({ projectId, canManage, currentUserId }) {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [category, setCategory] = useState('Requirement');
  const [queue, setQueue]     = useState([]);          // files picked, not yet uploaded
  const [progress, setProgress] = useState(null);
  const [uploadErr, setUploadErr] = useState('');
  const [drag, setDrag]       = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const inputRef = useRef(null);

  const categories = canManage ? DOC_CATEGORIES : DOC_CATEGORIES.filter(c => !FINANCE_DOC_CATEGORIES.includes(c));

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setDocs(await documentService.getAll(projectId)); }
    catch { setError('Could not load documents.'); }
    finally { setLoading(false); }
  }, [projectId]);
  useEffect(() => { load(); }, [load]);

  const addFiles = (list) => {
    const ok = []; const bad = [];
    Array.from(list).forEach(f => {
      if (!ALLOWED_EXT.includes(ext(f.name))) bad.push(`${f.name}: unsupported type`);
      else if (f.size > MAX_DOC_MB * 1048576) bad.push(`${f.name}: larger than ${MAX_DOC_MB} MB`);
      else ok.push(f);
    });
    setUploadErr(bad.join(' · '));
    setQueue(q => [...q, ...ok].slice(0, 10));
  };

  const upload = async () => {
    if (!queue.length) return;
    setProgress(0); setUploadErr('');
    try {
      const created = await documentService.upload(projectId, queue, category, setProgress);
      setDocs(prev => [...created, ...prev]);
      setQueue([]);
    } catch (err) {
      const e = err.response?.data?.errors;
      setUploadErr(e ? Object.values(e).flat().join(' ') : (err.response?.data?.message || 'Upload failed. The file may exceed the server upload limit.'));
    } finally { setProgress(null); }
  };

  const download = async (d) => {
    try { await documentService.download(projectId, d); }
    catch { setError('Download failed.'); }
  };
  const remove = async () => {
    try { await documentService.delete(projectId, confirmDel); setDocs(prev => prev.filter(d => d.id !== confirmDel)); }
    catch (err) { setError(err.response?.data?.message || 'Could not delete the document.'); }
    setConfirmDel(null);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      {/* Upload */}
      <Card>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:14, alignItems:'end', marginBottom:12 }}>
          <div
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
            onClick={() => inputRef.current?.click()}
            style={{ border:`2px dashed ${drag ? '#2E6DB4' : 'var(--border)'}`, background: drag ? 'var(--accent-dim)' : 'var(--bg-elevated)', borderRadius:10, padding:'18px 14px', textAlign:'center', cursor:'pointer' }}
          >
            <UploadCloud size={22} color="#2E6DB4"/>
            <div style={{ fontSize:14, fontWeight:600, marginTop:4 }}>Drop files here or click to browse</div>
            <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>PDF, Word, Excel, PowerPoint, images, ZIP · up to {MAX_DOC_MB} MB each · max 10 files</div>
            <input ref={inputRef} type="file" multiple onChange={e => { addFiles(e.target.files); e.target.value = ''; }} style={{ display:'none' }}/>
          </div>
          <Field label="Document type">
            <select value={category} onChange={e => setCategory(e.target.value)} style={inputStyle()}>
              {categories.map(c => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        {queue.length > 0 && (
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:10 }}>
            {queue.map((f, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, padding:'6px 10px', borderRadius:7, background:'var(--bg-elevated)' }}>
                <FileIcon name={f.name}/><span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                <span style={{ color:'var(--text-muted)' }}>{size(f.size)}</span>
                <span onClick={() => setQueue(q => q.filter((_, j) => j !== i))} style={{ cursor:'pointer', color:'var(--text-muted)', fontWeight:800 }}>×</span>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <Btn icon={<UploadCloud size={13}/>} onClick={upload} disabled={progress !== null}>{progress !== null ? `Uploading… ${progress}%` : `Upload ${queue.length} file${queue.length > 1 ? 's' : ''}`}</Btn>
              {progress === null && <Btn variant="ghost" onClick={() => setQueue([])}>Clear</Btn>}
            </div>
          </div>
        )}
        {uploadErr && <div style={{ fontSize:13, color:'var(--danger)' }}>{uploadErr}</div>}
      </Card>

      {/* List */}
      <Card style={{ padding:0, overflow:'hidden' }}>
        {error && <div style={{ padding:'10px 16px', fontSize:13, color:'var(--danger)' }}>{error}</div>}
        {loading ? <div style={{ padding:24, textAlign:'center', color:'var(--text-muted)', fontSize:14 }}>Loading documents…</div>
        : docs.length === 0 ? <EmptyState icon="📎" message="No documents attached yet."/>
        : docs.map(d => {
            const mine = d.uploadedBy?.id === currentUserId;
            return (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'11px 16px', borderBottom:'1px solid var(--border)' }}>
                <FileIcon name={d.name}/>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', marginTop:2 }}>{size(d.size)} · {d.uploadedBy?.name || 'Unknown'} · {when(d.createdAt)}</div>
                </div>
                <Badge label={d.category} color={CAT_COLOR[d.category] || '#6B7A99'}/>
                <Btn variant="ghost" size="sm" icon={<Download size={13}/>} onClick={() => download(d)}>Download</Btn>
                {(canManage || mine) && <Btn variant="ghost" size="sm" icon={<Trash2 size={13}/>} onClick={() => setConfirmDel(d.id)}>Delete</Btn>}
              </div>
            );
          })}
      </Card>

      {confirmDel && <ConfirmModal message="Delete this document permanently?" onConfirm={remove} onCancel={() => setConfirmDel(null)}/>}
    </div>
  );
}
