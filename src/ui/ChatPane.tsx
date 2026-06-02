/** The centre pane: the guided conversation — editorial, narrow, high-contrast.
 *  Agent speaks in prose (markdown); the user's turns are compact chips. A thread
 *  bar switches / renames / starts chats; a jump button drops to the latest. */

import { type ChangeEvent, type DragEvent, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ImageBlock } from '../agent/types';
import type { ChatState } from '../app/useChat';
import { ArrowUp, PaperclipIcon, PlusIcon, TrashIcon } from './icons';
import { useT } from '../i18n';
import { classifyAttachment } from './attachments';
import { DiffCard } from './DiffCard';
import { Select } from './Select';

function fileToImageBlock(file: File): Promise<ImageBlock | null> {
  return new Promise(resolve => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const comma = url.indexOf(',');
      resolve({ type: 'image', mediaType: file.type, dataBase64: comma >= 0 ? url.slice(comma + 1) : url });
    };
    reader.readAsDataURL(file);
  });
}

export function ChatPane({ chat }: { chat: ChatState }) {
  const t = useT();
  const [text, setText] = useState('');
  const [images, setImages] = useState<ImageBlock[]>([]);
  const [docs, setDocs] = useState<{ name: string; text: string }[]>([]);
  const [pdfs, setPdfs] = useState<{ name: string; file: File }[]>([]);
  const [dragging, setDragging] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [atBottom, setAtBottom] = useState(true);
  const logRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const addFiles = async (files: File[]) => {
    const imgs: ImageBlock[] = [];
    const texts: { name: string; text: string }[] = [];
    const docsPdf: { name: string; file: File }[] = [];
    const skip: string[] = [];
    for (const f of files) {
      const kind = classifyAttachment(f.name, f.type);
      if (kind === 'image') {
        const b = await fileToImageBlock(f);
        if (b) imgs.push(b);
      } else if (kind === 'pdf') {
        docsPdf.push({ name: f.name, file: f });
      } else if (kind === 'text') {
        texts.push({ name: f.name, text: await f.text() });
      } else {
        skip.push(f.name);
      }
    }
    if (imgs.length) setImages(prev => [...prev, ...imgs]);
    if (texts.length) setDocs(prev => [...prev, ...texts]);
    if (docsPdf.length) setPdfs(prev => [...prev, ...docsPdf]);
    setSkipped(skip); // names we couldn't read (e.g. Office) — shown, not silently dropped
  };

  const onPickFiles = async (e: ChangeEvent<HTMLInputElement>) => {
    await addFiles(e.target.files ? [...e.target.files] : []);
    e.target.value = '';
  };

  const currentTitle = chat.threads.find(t => t.id === chat.currentId)?.title ?? 'New chat';
  // Show the thinking dots only while we're waiting — not once the reply is
  // streaming in (the growing assistant message is the indicator then).
  const last = chat.messages[chat.messages.length - 1];
  const showThinking = chat.busy && !chat.pending && last?.role !== 'assistant';

  useEffect(() => {
    const el = logRef.current;
    if (el && atBottom) el.scrollTop = el.scrollHeight;
  }, [chat.messages, chat.busy, chat.pending, atBottom]);

  // grow the composer with the text, up to a cap
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [text]);

  const onScroll = () => {
    const el = logRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 80);
  };
  const jump = () => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  };

  const submit = async () => {
    const t = text.trim();
    if (!t && images.length === 0 && docs.length === 0 && pdfs.length === 0) return;
    const imgs = images;
    const ds = docs;
    const ps = pdfs;
    setText('');
    setImages([]);
    setDocs([]);
    setPdfs([]);
    setSkipped([]);
    await chat.send(t, imgs, ds, ps);
  };

  const onDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    await addFiles([...e.dataTransfer.files]);
  };

  const commitRename = () => {
    chat.renameThread(chat.currentId, draft);
    setEditing(false);
  };

  return (
    <div
      className={`chat ${dragging ? 'is-dragging' : ''}`}
      onDragOver={e => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <div className="chat__bar">
        {editing ? (
          <>
            <input
              className="chat__rename"
              value={draft}
              autoFocus
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') commitRename();
                if (e.key === 'Escape') setEditing(false);
              }}
            />
            <button className="chat__act" onMouseDown={e => { e.preventDefault(); commitRename(); }}>{t('chat.save')}</button>
            <button className="chat__act" onMouseDown={e => { e.preventDefault(); setEditing(false); }}>{t('chat.cancel')}</button>
          </>
        ) : confirmDelete ? (
          <>
            <span className="chat__confirm">{t('chat.deleteConfirm')}</span>
            <button
              className="chat__act chat__act--danger"
              onClick={() => {
                chat.deleteChat(chat.currentId);
                setConfirmDelete(false);
              }}
            >
              {t('chat.delete')}
            </button>
            <button className="chat__act" onClick={() => setConfirmDelete(false)}>{t('chat.cancel')}</button>
          </>
        ) : (
          <>
            <Select
              variant="ghost"
              ariaLabel={t('chat.switch')}
              value={chat.currentId}
              options={
                chat.threads.length
                  ? chat.threads.map(th => ({ value: th.id, label: th.title }))
                  : [{ value: chat.currentId, label: t('chat.newChat') }]
              }
              onChange={chat.openThread}
            />
            <button
              className="chat__act"
              title={t('chat.rename')}
              onClick={() => {
                setDraft(currentTitle);
                setEditing(true);
              }}
            >
              {t('chat.rename')}
            </button>
            <button className="chat__act chat__icon" title={t('chat.deleteChat')} aria-label={t('chat.deleteChat')} onClick={() => setConfirmDelete(true)}>
              <TrashIcon />
            </button>
            <button className="chat__act chat__new" title={t('chat.newChat')} onClick={chat.newChat}>
              <PlusIcon size={13} />
              {t('chat.new')}
            </button>
          </>
        )}
      </div>

      <div className="chat__scroll" ref={logRef} onScroll={onScroll}>
        <div className="chat__log">
          {chat.messages.map((m, i) =>
            m.role === 'user' ? (
              <div key={i} className="msg msg--user">
                <div className="msg__chip">{m.text}</div>
              </div>
            ) : (
              <div key={i} className="msg msg--agent">
                <div className="prose">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                </div>
              </div>
            ),
          )}
          {showThinking && (
            <div className="msg msg--agent">
              <div className="thinking">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
          {chat.pending && (
            <DiffCard
              name={chat.pending.name}
              input={chat.pending.input}
              onApply={() => chat.resolvePending(true)}
              onReject={() => chat.resolvePending(false)}
            />
          )}
          {chat.error && <div className="error">{chat.error}</div>}
        </div>

        {!atBottom && (
          <button className="chat__jump" title={t('chat.jump')} onClick={jump}>
            ↓
          </button>
        )}
      </div>

      <div className="composer">
        {(images.length > 0 || docs.length > 0 || pdfs.length > 0) && (
          <div className="composer__chips">
            {docs.map((d, i) => (
              <span key={`d${i}`} className="composer__chip">{d.name}</span>
            ))}
            {pdfs.map((p, i) => (
              <span key={`p${i}`} className="composer__chip">{p.name}</span>
            ))}
            {images.length > 0 && <span className="composer__chip">{t('chat.images', images.length)}</span>}
          </div>
        )}
        {skipped.length > 0 && <div className="composer__skip">{t('chat.unsupported', skipped.join(', '))}</div>}
        <div className="composer__box">
          <button type="button" className="composer__attach" onClick={() => fileRef.current?.click()} aria-label={t('chat.attach')} title={t('chat.attach')}>
            <PaperclipIcon />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf,.pdf,text/*,.md,.markdown,.txt,.csv,.json,.yaml,.yml"
            multiple
            hidden
            onChange={onPickFiles}
          />
          <textarea
            ref={taRef}
            className="composer__input"
            value={text}
            rows={1}
            placeholder={t('chat.message')}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <button className="composer__send" disabled={chat.busy} onClick={() => void submit()} aria-label={t('chat.send')}>
            <ArrowUp />
          </button>
        </div>
      </div>
    </div>
  );
}
