
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Template, FormData, ProductCombo, Section } from './types';
import { SECTIONS, VIDEO_PLACEMENT_TEMPLATE_CONTENT, PROFIT_SHARING_TEMPLATE_CONTENT } from './constants';
import { useLocalStorage } from './hooks/useLocalStorage';
import { TrashIcon, DownloadIcon, ShareIcon } from './components/icons';

const initialFormData: FormData = {
  '立約人': '', '平台': 'YouTube', '頻道': '', '推廣產品': '', '提供產品': '', '遊戲主題': '',
  '合約期間_起': '', '合約期間_迄': '', '合約費用合計': '0', '合約製作日期': new Date().toISOString().split('T')[0],
  '影片製作_數量': '0', '影片插片_數量': '0', '影片費用': '0', '授權影片': '本合約影片', '授權期間': '2025/01/01-2025/12/31',
  '授權範圍': '', '授權費用': '0', '分潤期間': '2025/01/01-2025/12/31', '分潤比例': '0', '分潤保底': '0', '免單期間': '2025/01/01-2025/12/31',
  '免單抽獎數量': '0', '免單單筆上限': '0', '產品組合': [{ id: crypto.randomUUID(), name: '', price: '' }],
  '已有商品': '', '備註': '', '乙方電話': '', '乙方地址': '', '乙方身份證字號': ''
};

const FIELD_LABELS: { [key: string]: string } = {
    '立約人': '立約人 (乙方)', '平台': '平台', '頻道': '頻道', '推廣產品': '推廣產品', 
    '提供產品': '提供產品', '遊戲主題': '遊戲主題', '合約期間_起': '合約期間 (起)',
    '合約期間_迄': '合約期間 (迄)', '合約費用合計': '合約費用合計 (TWD)', '合約製作日期': '合約製作日期',
    '乙方電話': '乙方電話', '乙方地址': '乙方地址', '乙方身份證字號': '乙方身份證字號',
    '影片製作_數量': '影片製作 (數量)', '影片插片_數量': '影片插片 (數量)', '影片費用': '影片費用 (TWD)',
    '授權影片': '授權影片 (同合約/影片)', '授權期間': '授權期間', '授權範圍': '授權範圍', '授權費用': '授權費用 (TWD)',
    '分潤期間': '分潤期間', '分潤比例': '分潤比例 (%)', '分潤保底': '分潤保底 (TWD)',
    '免單期間': '免單期間', '免單抽獎數量': '免單抽獎數量', '免單單筆上限': '免單單筆上限 (TWD)',
    '產品組合': '產品組合', '已有商品': '已有商品', '備註': '備註'
};
const placeholderList = Object.entries(FIELD_LABELS).map(([key, label]) => ({ key, label }));

const defaultTemplates: Template[] = [
    { id: 'video_placement_default', name: '影片置入', content: VIDEO_PLACEMENT_TEMPLATE_CONTENT },
    { id: 'profit_sharing_default', name: '純分潤', content: PROFIT_SHARING_TEMPLATE_CONTENT }
];
const defaultTemplateIds = defaultTemplates.map(t => t.id);

// Helper components defined outside App to prevent re-renders
const FormInput: React.FC<{label: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void; type?: string; isTextArea?: boolean}> = ({ label, name, value, onChange, type = 'text', isTextArea = false }) => (
    <div className="flex flex-col space-y-1">
        <label htmlFor={name} className="text-sm font-medium text-gray-400">{label}</label>
        {isTextArea ? (
          <textarea id={name} name={name} value={value} onChange={onChange} rows={3} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
        ) : (
          <input type={type} id={name} name={name} value={value} onChange={onChange} className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"/>
        )}
    </div>
);

const ContractRenderer: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;

    const renderLine = (line: string, index: number) => {
        const trimmedLine = line.trim();

        if (trimmedLine === '乙方') {
            return (
                <div key={index} className="mt-6">
                    <h3 className="text-lg font-bold mb-3">{trimmedLine}</h3>
                    <div data-signature-target className="relative h-24 mb-4 max-w-sm"></div>
                </div>
            );
        }

        if (trimmedLine.endsWith('專案合作備忘錄')) {
            return <h2 key={index} className="text-2xl font-bold text-center mb-8">{trimmedLine}</h2>;
        }
        if (/^[一二三四五六七八九十]+、/.test(trimmedLine) || trimmedLine === '甲方') {
            return <h3 key={index} className="text-lg font-bold mt-6 mb-3">{trimmedLine}</h3>;
        }
        if (trimmedLine.startsWith('姓名：')) {
            return (
                <p
                    key={index}
                    className="mb-2 text-justify"
                    data-signature-name-line
                >
                    {line}
                </p>
            );
        }
        if (/^\d+(\.\d+)*\s/.test(trimmedLine)) {
            return <p key={index} className="mb-2 pl-6" style={{ textIndent: '-1.5rem' }}>{line}</p>;
        }
        if (trimmedLine === '') {
            return <div key={index} className="h-2"></div>;
        }
        return <p key={index} className="mb-2 text-justify">{line}</p>;
    };

    return (
        <div className="bg-white text-black p-8 sm:p-12 rounded-lg shadow-lg font-serif lining-nums">
            {content.split('\n').map(renderLine)}
        </div>
    );
};

const generateStyledHtmlForExport = (content: string): string => {
    if (!content) return '';

    const renderLineToHtml = (line: string): string => {
        const trimmedLine = line.trim();
        const basePStyle = `margin-bottom: 8px; text-align: justify; line-height: 1.6;`;

        if (trimmedLine === '乙方') {
            return `
                <div style="margin-top: 24px;">
                    <h3 style="font-size: 1.17em; font-weight: bold; margin-bottom: 12px;">${trimmedLine}</h3>
                    <div data-signature-target style="position: relative; height: 110px; margin-bottom: 16px; max-width: 320px;"></div>
                </div>
            `;
        }

        if (trimmedLine.endsWith('專案合作備忘錄')) {
            return `<h2 style="font-size: 1.5em; font-weight: bold; text-align: center; margin-bottom: 32px;">${trimmedLine}</h2>`;
        }
        if (/^[一二三四五六七八九十]+、/.test(trimmedLine) || trimmedLine === '甲方') {
            return `<h3 style="font-size: 1.17em; font-weight: bold; margin-top: 24px; margin-bottom: 12px;">${trimmedLine}</h3>`;
        }
        if (trimmedLine.startsWith('姓名：')) {
            return `<p data-signature-name-line style="${basePStyle}">${line}</p>`;
        }
        if (/^\d+(\.\d+)*\s/.test(trimmedLine)) {
            return `<p style="${basePStyle} padding-left: 1.5em; text-indent: -1.5em;">${line}</p>`;
        }
        if (trimmedLine === '') {
            return `<div style="height: 0.5em;"></div>`;
        }
        return `<p style="${basePStyle}">${line}</p>`;
    };
    
    const htmlLines = content.split('\n').map(renderLineToHtml).join('');
    return `<div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt; font-variant-numeric: lining-nums;">${htmlLines}</div>`;
};


interface SharePayload {
    id: string;
    content: string;
    createdAt: number;
}

const encodeSharePayload = (payload: SharePayload): string => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    let binary = '';
    data.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
};

const decodeSharePayload = (encoded: string): SharePayload => {
    const normalized = encoded.replace(/\s/g, '+');
    const binary = atob(normalized);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(bytes)) as SharePayload;
};

const generatePdfBlobFromElement = async (element: HTMLElement): Promise<Blob | null> => {
    const jspdfLib = (window as any).jspdf;
    const html2canvas = (window as any).html2canvas;

    if (!jspdfLib || !html2canvas) {
        alert('PDF 生成工具尚未載入，請稍後再試。');
        return null;
    }

    const { jsPDF } = jspdfLib;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = 10;
    const usableWidth = pdfWidth - margin * 2;
    const usableHeight = pdfHeight - margin * 2;

    const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true
    });

    const imgData = canvas.toDataURL('image/png');
    const imgHeight = (canvas.height * usableWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
    heightLeft -= usableHeight;

    while (heightLeft > 0) {
        position = position - usableHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', margin, position, usableWidth, imgHeight);
        heightLeft -= usableHeight;
    }

    return pdf.output('blob');
};

const SignatureModal: React.FC<{ onClose: () => void; onConfirm: (dataUrl: string) => void; }> = ({ onClose, onConfirm }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#111827';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
    }, []);

    const getCanvasCoordinates = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        return {
            x: ((event.clientX - rect.left) / rect.width) * canvas.width,
            y: ((event.clientY - rect.top) / rect.height) * canvas.height
        };
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
        const point = getCanvasCoordinates(event);
        if (!point) return;
        setIsDrawing(true);
        lastPointRef.current = point;
        event.currentTarget.setPointerCapture(event.pointerId);
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        const point = getCanvasCoordinates(event);
        if (!canvas || !ctx || !point || !lastPointRef.current) return;

        ctx.beginPath();
        ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        lastPointRef.current = point;
        event.preventDefault();
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        setIsDrawing(false);
        lastPointRef.current = null;
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const handleClear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const handleConfirm = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        onConfirm(canvas.toDataURL('image/png'));
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-100">簽名板</h3>
                    <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-200 transition">關閉</button>
                </div>
                <p className="text-sm text-gray-300">請使用滑鼠或觸控板於下方空白區域簽名，簽名完成後點擊「確認簽名」。</p>
                <div className="bg-white rounded-md overflow-hidden border border-gray-600">
                    <canvas
                        ref={canvasRef}
                        width={900}
                        height={300}
                        className="w-full h-64 touch-none"
                        onPointerDown={handlePointerDown}
                        onPointerMove={handlePointerMove}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                    />
                </div>
                <div className="flex items-center justify-between">
                    <button onClick={handleClear} className="text-sm text-blue-300 hover:text-blue-200 transition">清除重畫</button>
                    <div className="space-x-3">
                        <button onClick={onClose} className="px-4 py-2 rounded-md border border-gray-600 text-gray-300 hover:bg-gray-700 transition">取消</button>
                        <button onClick={handleConfirm} className="px-4 py-2 rounded-md bg-blue-600 text-white font-semibold hover:bg-blue-500 transition">確認簽名</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SharedContractView: React.FC<{ payload: SharePayload; }> = ({ payload }) => {
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
    const [signaturePlacement, setSignaturePlacement] = useState({ x: 40, y: 40, scale: 1 });
    const [isDraggingSignature, setIsDraggingSignature] = useState(false);
    const [hasManualSignatureAdjustment, setHasManualSignatureAdjustment] = useState(false);
    const [isShareLinkExpanded, setIsShareLinkExpanded] = useState(false);
    const contractRef = useRef<HTMLDivElement>(null);
    const signatureImageRef = useRef<HTMLImageElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    const shareLink = useMemo(() => window.location.href, []);

    const alignSignatureToTarget = useCallback(() => {
        if (!signatureDataUrl || hasManualSignatureAdjustment) {
            return;
        }
        if (!contractRef.current || !signatureImageRef.current) {
            return;
        }

        const signatureEl = signatureImageRef.current;
        if (!signatureEl.complete || !signatureEl.naturalWidth || !signatureEl.naturalHeight) {
            return;
        }

        const contractEl = contractRef.current;
        const targetNodes = contractEl.querySelectorAll('[data-signature-target]');
        const fallbackNodes = contractEl.querySelectorAll('[data-signature-name-line]');
        const target = targetNodes.length ? (targetNodes[targetNodes.length - 1] as HTMLElement) : null;
        const fallback = !target && fallbackNodes.length ? (fallbackNodes[fallbackNodes.length - 1] as HTMLElement) : null;
        const anchor = target ?? fallback;

        if (!anchor) {
            return;
        }

        const containerRect = contractEl.getBoundingClientRect();
        const anchorRect = anchor.getBoundingClientRect();
        const naturalWidth = signatureEl.naturalWidth;
        const naturalHeight = signatureEl.naturalHeight;

        if (!naturalWidth || !naturalHeight) {
            return;
        }

        const containerWidth = contractEl.clientWidth || anchorRect.width;
        const baseWidth = anchorRect.width || containerWidth * 0.6;
        const desiredWidth = Math.min(Math.max(baseWidth * 0.9, 220), containerWidth * 0.85);
        const scale = Math.min(Math.max(desiredWidth / naturalWidth, 0.3), 3);
        const scaledWidth = naturalWidth * scale;
        const scaledHeight = naturalHeight * scale;

        let x = anchorRect.left - containerRect.left;
        let y = anchorRect.top - containerRect.top;

        if (target) {
            x += (anchorRect.width - scaledWidth) / 2;
            y += (anchorRect.height - scaledHeight) / 2;
        } else {
            y -= scaledHeight + 12;
        }

        x = Math.max(x, 0);
        y = Math.max(y, 0);

        setSignaturePlacement({ x, y, scale });
    }, [hasManualSignatureAdjustment, signatureDataUrl]);

    useEffect(() => {
        if (!signatureDataUrl) {
            return;
        }
        const id = window.setTimeout(() => {
            alignSignatureToTarget();
        }, 0);
        return () => window.clearTimeout(id);
    }, [signatureDataUrl, alignSignatureToTarget]);

    useEffect(() => {
        if (!signatureDataUrl || hasManualSignatureAdjustment) {
            return;
        }
        window.addEventListener('resize', alignSignatureToTarget);
        return () => window.removeEventListener('resize', alignSignatureToTarget);
    }, [signatureDataUrl, hasManualSignatureAdjustment, alignSignatureToTarget]);

    const handleSignatureConfirm = (dataUrl: string) => {
        setSignatureDataUrl(dataUrl);
        setSignaturePlacement({ x: 40, y: 40, scale: 1 });
        setHasManualSignatureAdjustment(false);
        setIsSignatureModalOpen(false);
    };

    const handlePointerDown = (event: React.PointerEvent<HTMLImageElement>) => {
        if (!contractRef.current) return;
        const imageRect = event.currentTarget.getBoundingClientRect();
        dragOffset.current = {
            x: event.clientX - imageRect.left,
            y: event.clientY - imageRect.top
        };
        setIsDraggingSignature(true);
        setHasManualSignatureAdjustment(true);
        event.currentTarget.setPointerCapture(event.pointerId);
        event.preventDefault();
    };

    const handlePointerMove = (event: React.PointerEvent<HTMLImageElement>) => {
        if (!isDraggingSignature || !contractRef.current) return;
        const contractRect = contractRef.current.getBoundingClientRect();
        const newX = event.clientX - contractRect.left - dragOffset.current.x;
        const newY = event.clientY - contractRect.top - dragOffset.current.y;
        setSignaturePlacement(prev => ({ ...prev, x: newX, y: newY }));
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLImageElement>) => {
        if (!isDraggingSignature) return;
        setIsDraggingSignature(false);
        event.currentTarget.releasePointerCapture(event.pointerId);
    };

    const handleShareToLine = async () => {
        if (!contractRef.current) return;
        if (!signatureDataUrl) {
            alert('請先簽名並將簽名放置於合約中。');
            return;
        }

        const blob = await generatePdfBlobFromElement(contractRef.current);
        if (!blob) return;

        const file = new File([blob], `signed-contract-${payload.id}.pdf`, { type: 'application/pdf' });
        const nav = navigator as any;

        if (nav.share && typeof nav.share === 'function' && (!nav.canShare || nav.canShare({ files: [file] }))) {
            try {
                await nav.share({ files: [file], text: '簽署完成的合約 PDF' });
            } catch (error) {
                console.error('Share failed', error);
                alert('分享失敗，請確認裝置是否支援分享。');
            }
            return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `signed-contract-${payload.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        alert('已下載包含簽名的 PDF，請於 LINE 中手動分享該檔案。');
    };

    const handleDownloadSignedPdf = async () => {
        if (!contractRef.current) return;
        const blob = await generatePdfBlobFromElement(contractRef.current);
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `signed-contract-${payload.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const copyShareLink = async () => {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(shareLink);
                alert('分享連結已複製。');
                return;
            } catch (error) {
                console.warn('Clipboard copy failed', error);
            }
        }
        window.prompt('請複製分享連結', shareLink);
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
                    <div>
                        <h1 className="text-3xl font-bold text-blue-300">合約簽署頁面</h1>
                        <p className="text-sm text-gray-400 mt-1">分享時間：{new Date(payload.createdAt).toLocaleString()}</p>
                    </div>
                </div>

                {signatureDataUrl && (
                    <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 space-y-3">
                        <h3 className="text-base font-semibold text-gray-100">簽名調整</h3>
                        <p className="text-sm text-gray-300">拖曳簽名即可移動位置，使用下方滑桿調整大小。</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            <label className="text-sm text-gray-300">簽名大小</label>
                            <input
                                type="range"
                                min={0.3}
                                max={3}
                                step={0.05}
                                value={signaturePlacement.scale}
                                onChange={(e) => {
                                    setHasManualSignatureAdjustment(true);
                                    setSignaturePlacement(prev => ({ ...prev, scale: parseFloat(e.target.value) }));
                                }}
                                className="flex-1"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setHasManualSignatureAdjustment(false);
                                        setIsSignatureModalOpen(true);
                                    }}
                                    className="px-3 py-1 text-sm rounded border border-gray-600 text-gray-300 hover:bg-gray-700 transition"
                                >
                                    重新簽名
                                </button>
                                <button
                                    onClick={() => {
                                        setSignatureDataUrl(null);
                                        setHasManualSignatureAdjustment(false);
                                    }}
                                    className="px-3 py-1 text-sm rounded border border-red-500 text-red-300 hover:bg-red-500/20 transition"
                                >
                                    移除簽名
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={contractRef} className="relative">
                    <ContractRenderer content={payload.content} />
                    {signatureDataUrl && (
                        <img
                            src={signatureDataUrl}
                            alt="簽名"
                            ref={signatureImageRef}
                            className="absolute top-0 left-0 cursor-move select-none"
                            style={{
                                transform: `translate(${signaturePlacement.x}px, ${signaturePlacement.y}px) scale(${signaturePlacement.scale})`,
                                transformOrigin: 'top left'
                            }}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={handlePointerUp}
                            onLoad={alignSignatureToTarget}
                        />
                    )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
                    <button
                        onClick={() => {
                            setIsSignatureModalOpen(true);
                            if (!signatureDataUrl) {
                                setHasManualSignatureAdjustment(false);
                            }
                        }}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
                    >
                        確認並簽名
                    </button>
                    <button onClick={handleDownloadSignedPdf} className="flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-green-600 hover:bg-green-500 text-white font-semibold transition">
                        <DownloadIcon /> 下載簽署 PDF
                    </button>
                    <button onClick={handleShareToLine} className="flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-green-500/20 border border-green-400 text-green-200 hover:bg-green-500/30 transition">
                        <ShareIcon /> 分享至 LINE
                    </button>
                </div>

                <div className="pt-2">
                    <button
                        onClick={() => setIsShareLinkExpanded(prev => !prev)}
                        className="w-full flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800/40 px-4 py-3 text-left text-sm font-medium text-gray-200 hover:bg-gray-800/60 transition"
                        aria-expanded={isShareLinkExpanded}
                    >
                        <span>分享連結</span>
                        <span className="text-lg leading-none text-gray-400">{isShareLinkExpanded ? '−' : '+'}</span>
                    </button>
                    {isShareLinkExpanded && (
                        <div className="mt-3 space-y-3 rounded-lg border border-gray-700 bg-gray-800/60 p-4">
                            <p className="text-sm break-all text-gray-300">{shareLink}</p>
                            <button onClick={copyShareLink} className="text-sm text-blue-300 hover:text-blue-200 transition">複製分享連結</button>
                        </div>
                    )}
                </div>
            </div>

            {isSignatureModalOpen && (
                <SignatureModal
                    onClose={() => setIsSignatureModalOpen(false)}
                    onConfirm={handleSignatureConfirm}
                />
            )}
        </div>
    );
};


const App: React.FC = () => {
    const [customTemplates, setCustomTemplates] = useLocalStorage<Template[]>('contract_custom_templates', []);
    const templates = useMemo(() => [...defaultTemplates, ...customTemplates], [customTemplates]);
    
    const [selectedTemplateId, setSelectedTemplateId] = useState<string>('video_placement_default');
    const [templateName, setTemplateName] = useState('');
    const [templateContent, setTemplateContent] = useState('');
    
    const [selectedSections, setSelectedSections] = useState<Record<string, boolean>>({});
    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [generatedContract, setGeneratedContract] = useState('');
    const [activeTab, setActiveTab] = useState('generate');
    const [isTotalFeeManuallySet, setIsTotalFeeManuallySet] = useState(false);
    const [shareViewPayload, setShareViewPayload] = useState<SharePayload | null>(() => {
        try {
            const params = new URLSearchParams(window.location.search);
            const shareParam = params.get('share');
            if (!shareParam) return null;
            return decodeSharePayload(shareParam);
        } catch (error) {
            console.error('Failed to parse initial share payload', error);
            return null;
        }
    });

    const templateContentRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const template = templates.find(t => t.id === selectedTemplateId);
        if (template) {
            setTemplateName(template.name);
            setTemplateContent(template.content);
        } else if (templates.length > 0) {
            setSelectedTemplateId('video_placement_default');
        }
    }, [selectedTemplateId, templates]);

    useEffect(() => {
        if (isTotalFeeManuallySet) return;

        const videoFeeNum = parseInt(formData['影片費用'], 10) || 0;
        const licenseFeeNum = parseInt(formData['授權費用'], 10) || 0;
        const profitShareNum = parseInt(formData['分潤比例'], 10) || 0;

        const baseFee = videoFeeNum + licenseFeeNum;
        const formattedBaseFee = baseFee.toLocaleString('en-US');

        let totalFeeString = formattedBaseFee;

        if (selectedSections['profit_sharing'] && profitShareNum > 0) {
            totalFeeString += `+${profitShareNum}%分潤費用`;
        }

        setFormData(prev => ({ ...prev, '合約費用合計': totalFeeString }));
    }, [
        formData['影片費用'],
        formData['授權費用'],
        formData['分潤比例'],
        selectedSections['profit_sharing'],
        isTotalFeeManuallySet
    ]);

    useEffect(() => {
        const syncShareState = () => {
            const params = new URLSearchParams(window.location.search);
            const shareParam = params.get('share');

            if (!shareParam) {
                setShareViewPayload(null);
                return;
            }

            try {
                const decoded = decodeSharePayload(shareParam);
                setShareViewPayload(decoded);
            } catch (error) {
                console.error('Failed to decode share payload', error);
                alert('分享連結無效或已損毀，請重新取得。');
                params.delete('share');
                const newSearch = params.toString();
                const newUrl = newSearch ? `${window.location.pathname}?${newSearch}` : window.location.pathname;
                window.history.replaceState(null, '', newUrl);
                setShareViewPayload(null);
            }
        };

        syncShareState();
        const handlePopState = () => syncShareState();
        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);
    
    const saveNewTemplate = () => {
        if (!templateName.trim()) {
            alert('範本名稱不能為空');
            return;
        }
        const newTemplate: Template = { id: crypto.randomUUID(), name: templateName, content: templateContent };
        setCustomTemplates(prev => [...prev, newTemplate]);
        setSelectedTemplateId(newTemplate.id);
        alert('新範本已儲存');
    };

    const updateTemplate = () => {
        if (defaultTemplateIds.includes(selectedTemplateId)) {
            alert('不能修改預設範本，請先「另存為新範本」');
            return;
        }
        setCustomTemplates(prev =>
            prev.map(t =>
                t.id === selectedTemplateId
                ? { ...t, name: templateName, content: templateContent }
                : t
            )
        );
        alert('範本已更新');
    };

    const deleteTemplate = () => {
        if (defaultTemplateIds.includes(selectedTemplateId)) {
            alert('不能刪除預設範本');
            return;
        }
    
        const templateToDelete = customTemplates.find(t => t.id === selectedTemplateId);
        if (!templateToDelete) {
            alert('錯誤：找不到要刪除的範本，請重新整理後再試。');
            return;
        }
    
        const confirmed = window.confirm(`確定要刪除範本 "${templateToDelete.name}" 嗎？`);
        if (!confirmed) {
            return;
        }

        const updatedCustomTemplates = customTemplates.filter(t => t.id !== templateToDelete.id);
        setCustomTemplates(updatedCustomTemplates);

        const fallbackTemplateId = updatedCustomTemplates.length > 0
            ? updatedCustomTemplates[updatedCustomTemplates.length - 1].id
            : 'video_placement_default';

        setSelectedTemplateId(fallbackTemplateId);

        if (fallbackTemplateId === 'video_placement_default') {
            const defaultTemplate = defaultTemplates.find(t => t.id === fallbackTemplateId);
            if (defaultTemplate) {
                setTemplateName(defaultTemplate.name);
                setTemplateContent(defaultTemplate.content);
            }
        } else {
            const fallbackTemplate = updatedCustomTemplates.find(t => t.id === fallbackTemplateId);
            if (fallbackTemplate) {
                setTemplateName(fallbackTemplate.name);
                setTemplateContent(fallbackTemplate.content);
            }
        }
      
        alert(`範本 "${templateToDelete.name}" 已刪除`);
    };
    
    const handleSectionToggle = (sectionId: string) => {
        if (sectionId === 'profit_sharing') {
            setIsTotalFeeManuallySet(false);
        }
        setSelectedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        const isChecked = e.target.checked;
        const newSelected: Record<string, boolean> = {};
        SECTIONS.forEach(section => {
            newSelected[section.id] = isChecked;
        });
        setSelectedSections(newSelected);
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === '合約費用合計') {
            setIsTotalFeeManuallySet(true);
        }
        if (['影片費用', '授權費用', '分潤比例'].includes(name)) {
            setIsTotalFeeManuallySet(false);
        }
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProductComboChange = (index: number, field: 'name' | 'price', value: string) => {
        const newCombos = [...(formData['產品組合'] as ProductCombo[])];
        newCombos[index] = { ...newCombos[index], [field]: value };
        setFormData(prev => ({ ...prev, '產品組合': newCombos }));
    };

    const addProductCombo = () => {
        const newCombos = [...(formData['產品組合'] as ProductCombo[]), { id: crypto.randomUUID(), name: '', price: '' }];
        setFormData(prev => ({ ...prev, '產品組合': newCombos }));
    };

    const removeProductCombo = (index: number) => {
        const newCombos = (formData['產品組合'] as ProductCombo[]).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, '產品組合': newCombos }));
    };

    const handlePlaceholderInsert = (key: string) => {
        const textarea = templateContentRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const textToInsert = `{{${key}}}`;
        
        const newText = templateContent.substring(0, start) + textToInsert + templateContent.substring(end);
        setTemplateContent(newText);
        
        setTimeout(() => {
            if (templateContentRef.current) {
                templateContentRef.current.focus();
                const newCursorPos = start + textToInsert.length;
                templateContentRef.current.setSelectionRange(newCursorPos, newCursorPos);
            }
        }, 0);
    };

    const generateContractHandler = useCallback(() => {
        const activeTemplate = templates.find(t => t.id === selectedTemplateId);
        if (!activeTemplate) {
            alert('請選擇一個範本');
            return;
        }
    
        let content = activeTemplate.content;
    
        content = content.replace(/{{#section_(\w+)}}([\s\S]*?){{\/section_\1}}/g, (match, sectionKey, sectionContent) => {
            return selectedSections[sectionKey] ? sectionContent : '';
        });
    
        const lines = content.split('\n');
        
        let processedContent = lines.map(line => {
            const match = line.match(/{{(\S+?)}}/);
            if (!match) return line;
    
            const key = match[1];
            const value = String(formData[key as keyof FormData] || '');

            if (value.trim() === '' || value.trim() === '0') {
                 if (line.match(/^\s*\d+(\.\d+)*\s/)) {
                     return null;
                 }
            }
            return line;
        }).filter(line => line !== null).join('\n');
    
        Object.keys(formData).forEach(key => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            if (key === '產品組合') {
                const combos = formData[key] as ProductCombo[];
                const comboString = combos
                    .filter(c => c.name.trim() !== '')
                    .map(c => `${c.name} (優惠價: ${c.price})`)
                    .join('、 ');
                processedContent = processedContent.replace(placeholder, comboString || '無');
            } else {
                processedContent = processedContent.replace(placeholder, String(formData[key as keyof FormData]) || '');
            }
        });
    
        const chineseNumerals = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
        let mainSectionCounter = 0;
        processedContent = processedContent.replace(/^(\s*)[一二三四五六七八九十]+、/gm, (match, leadingWhitespace) => {
            const newNumber = chineseNumerals[mainSectionCounter++];
            return `${leadingWhitespace}${newNumber}、`;
        });
    
        const finalLines = processedContent.split('\n');
        const counters: { [key: number]: number } = {};
        const levelPrefixes: { [key: number]: string } = {};

        const renumberedLines = finalLines.map(line => {
            const match = line.match(/^(\s*)(\d+(?:\.\d+)*)\.?\s+/);
            if (!match) return line;

            const indent = match[1].length;
            const numberString = match[2];
            const level = numberString.split('.').length;

            if (!counters[level]) counters[level] = 0;
            
            for (let i = level + 1; i <= Object.keys(counters).length; i++) {
                counters[i] = 0;
            }

            counters[level]++;

            let newNumber = '';
            if (level === 1) {
                newNumber = `${counters[level]}`;
                levelPrefixes[level] = newNumber;
            } else {
                const parentPrefix = levelPrefixes[level-1] || '1';
                newNumber = `${parentPrefix}.${counters[level]}`;
                levelPrefixes[level] = newNumber;
            }
            
            return line.replace(numberString, newNumber);
        });

        let finalContent = renumberedLines.join('\n');
    
        finalContent = finalContent.replace(/^\s*\n/gm, '');
    
        setGeneratedContract(finalContent);
        setActiveTab('generate');
    }, [formData, selectedSections, templates, selectedTemplateId]);

    const isAllSelected = useMemo(() => SECTIONS.every(s => selectedSections[s.id]), [selectedSections]);
    const sectionsToDisplay = useMemo(() => ['basic', ...Object.keys(selectedSections).filter(key => selectedSections[key])], [selectedSections]);

    const exportToDoc = (content: string, filename: string) => {
        const styledHtml = generateStyledHtmlForExport(content);
        const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document</title></head><body>";
        const footer = "</body></html>";
        const sourceHTML = header + styledHtml + footer;

        const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
        const fileDownload = document.createElement("a");
        document.body.appendChild(fileDownload);
        fileDownload.href = source;
        fileDownload.download = `${filename}.doc`;
        fileDownload.click();
        document.body.removeChild(fileDownload);
    };

    const exportToPdf = async (elementId: string, filename: string) => {
        const sourceElement = document.getElementById(elementId);
        if (!sourceElement || !(window as any).jspdf || !(window as any).html2canvas) {
            console.error("PDF export failed: element not found or libraries not loaded.");
            alert("PDF 匯出失敗，請稍後再試。");
            return;
        }

        const loadingIndicator = document.createElement('div');
        loadingIndicator.innerText = '正在生成高品質 PDF... 請稍候';
        loadingIndicator.style.position = 'fixed';
        loadingIndicator.style.top = '50%';
        loadingIndicator.style.left = '50%';
        loadingIndicator.style.transform = 'translate(-50%, -50%)';
        loadingIndicator.style.backgroundColor = 'rgba(0,0,0,0.8)';
        loadingIndicator.style.color = 'white';
        loadingIndicator.style.padding = '20px';
        loadingIndicator.style.borderRadius = '10px';
        loadingIndicator.style.zIndex = '10000';
        document.body.appendChild(loadingIndicator);

        const pageRenderer = document.createElement('div');

        try {
            document.body.appendChild(pageRenderer);
            const { jsPDF } = (window as any).jspdf;
            const html2canvas = (window as any).html2canvas;
            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            const contentWidthMm = pdfWidth - margin * 2;
            const contentHeightMm = pdfHeight - margin * 2;

            const mmToPxRatio = (() => {
                const d = document.createElement("div");
                d.style.position = "absolute";
                d.style.top = "-9999px";
                d.style.width = "100mm";
                document.body.appendChild(d);
                const px = d.offsetWidth;
                document.body.removeChild(d);
                return px / 100;
            })();
            
            const contentHeightPx = contentHeightMm * mmToPxRatio;

            const sourceContainer = sourceElement.querySelector('div');
            if (!sourceContainer) {
                throw new Error("Contract content container not found.");
            }

            pageRenderer.style.position = 'absolute';
            pageRenderer.style.left = '-9999px';
            pageRenderer.style.top = '0';
            pageRenderer.style.width = `${contentWidthMm}mm`;
            pageRenderer.style.boxSizing = 'border-box';

            const computedStyle = window.getComputedStyle(sourceContainer);
            ['fontFamily', 'fontSize', 'lineHeight', 'color', 'backgroundColor', 'padding'].forEach(prop => {
                (pageRenderer.style as any)[prop] = (computedStyle as any)[prop];
            });

            const renderPage = async (container: HTMLElement) => {
                const canvas = await html2canvas(container, {
                    scale: 2,
                    useCORS: true,
                    height: container.scrollHeight, 
                    width: container.scrollWidth
                });
                const imgData = canvas.toDataURL('image/png');
                const imgProps = pdf.getImageProperties(imgData);
                const imgHeight = (imgProps.height * contentWidthMm) / imgProps.width;
                pdf.addImage(imgData, 'PNG', margin, margin, contentWidthMm, imgHeight);
            };

            const allChildren = Array.from(sourceContainer.children);
            let pageCount = 0;

            for (const child of allChildren) {
                const clonedChild = child.cloneNode(true) as HTMLElement;
                pageRenderer.appendChild(clonedChild);
                
                if (pageRenderer.offsetHeight > contentHeightPx) {
                    pageRenderer.removeChild(clonedChild);
                    
                    if (pageCount > 0) pdf.addPage();
                    await renderPage(pageRenderer);
                    pageCount++;
                    
                    pageRenderer.innerHTML = '';
                    pageRenderer.appendChild(clonedChild);
                }
            }
            
            if (pageRenderer.children.length > 0) {
                if (pageCount > 0) pdf.addPage();
                await renderPage(pageRenderer);
            }

            pdf.save(`${filename}.pdf`);

        } catch (error) {
            console.error("An error occurred during PDF generation:", error);
            alert("生成 PDF 時發生錯誤，請檢查主控台以獲取更多資訊。");
        } finally {
            if (pageRenderer.parentNode === document.body) {
                document.body.removeChild(pageRenderer);
            }
            document.body.removeChild(loadingIndicator);
        }
    };

    const handleCreateShareLink = useCallback(async () => {
        if (!generatedContract) {
            alert('請先生成合約後再分享。');
            return;
        }

        const payload: SharePayload = {
            id: crypto.randomUUID(),
            content: generatedContract,
            createdAt: Date.now()
        };

        const encoded = encodeSharePayload(payload);
        const shareUrl = `${window.location.origin}${window.location.pathname}?share=${encodeURIComponent(encoded)}`;

        const previewWindow = window.open(shareUrl, '_blank', 'noopener');
        if (!previewWindow) {
            console.warn('分享預覽視窗被瀏覽器阻擋。');
        }

        let copied = false;
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                copied = true;
                alert('分享連結已複製，並已開啟預覽頁面。');
            } catch (error) {
                console.warn('Clipboard write failed', error);
            }
        }

        if (!copied) {
            window.prompt('請複製以下分享連結', shareUrl);
        }
    }, [generatedContract]);
    
    const renderFormSection = (sectionId: string) => {
        switch (sectionId) {
            case 'basic': return (
                <div key="basic" className="p-4 bg-gray-800/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4 border-b border-gray-700 pb-2">基本資料</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <FormInput label="立約人 (乙方)" name="立約人" value={formData['立約人']} onChange={handleFormChange} />
                        <FormInput label="平台" name="平台" value={formData['平台']} onChange={handleFormChange} />
                        <FormInput label="頻道" name="頻道" value={formData['頻道']} onChange={handleFormChange} />
                        <FormInput label="推廣產品" name="推廣產品" value={formData['推廣產品']} onChange={handleFormChange} />
                        <FormInput label="提供產品" name="提供產品" value={formData['提供產品']} onChange={handleFormChange} />
                        <FormInput label="遊戲主題" name="遊戲主題" value={formData['遊戲主題']} onChange={handleFormChange} />
                        <FormInput label="合約期間 (起)" name="合約期間_起" value={formData['合約期間_起']} onChange={handleFormChange} type="date" />
                        <FormInput label="合約期間 (迄)" name="合約期間_迄" value={formData['合約期間_迄']} onChange={handleFormChange} type="date" />
                        <FormInput label="合約費用合計 (TWD)" name="合約費用合計" value={formData['合約費用合計']} onChange={handleFormChange} type="text" />
                        <FormInput label="合約製作日期" name="合約製作日期" value={formData['合約製作日期']} onChange={handleFormChange} type="date" />
                        <FormInput label="乙方電話" name="乙方電話" value={formData['乙方電話']} onChange={handleFormChange} />
                        <FormInput label="乙方地址" name="乙方地址" value={formData['乙方地址']} onChange={handleFormChange} />
                        <FormInput label="乙方身份證字號" name="乙方身份證字號" value={formData['乙方身份證字號']} onChange={handleFormChange} />
                    </div>
                </div>
            );
            case 'video_production': return (
                <div key={sectionId} className="p-4 bg-gray-800/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4 border-b border-gray-700 pb-2">影片資料</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput label="影片製作 (數量)" name="影片製作_數量" value={formData['影片製作_數量']} onChange={handleFormChange} type="number" />
                        <FormInput label="影片插片 (數量)" name="影片插片_數量" value={formData['影片插片_數量']} onChange={handleFormChange} type="number" />
                        <FormInput label="影片費用 (TWD)" name="影片費用" value={formData['影片費用']} onChange={handleFormChange} type="number" />
                    </div>
                </div>
            );
            case 'video_license': return (
                <div key={sectionId} className="p-4 bg-gray-800/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4 border-b border-gray-700 pb-2">授權資料</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormInput label="授權影片 (同合約/影片)" name="授權影片" value={formData['授權影片']} onChange={handleFormChange} />
                        <FormInput label="授權期間" name="授權期間" value={formData['授權期間']} onChange={handleFormChange} />
                        <FormInput label="授權範圍" name="授權範圍" value={formData['授權範圍']} onChange={handleFormChange} />
                        <FormInput label="授權費用 (TWD)" name="授權費用" value={formData['授權費用']} onChange={handleFormChange} type="number" />
                    </div>
                </div>
            );
            case 'profit_sharing': return (
                <div key={sectionId} className="p-4 bg-gray-800/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4 border-b border-gray-700 pb-2">分潤</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput label="分潤期間" name="分潤期間" value={formData['分潤期間']} onChange={handleFormChange} />
                        <FormInput label="分潤比例 (%)" name="分潤比例" value={formData['分潤比例']} onChange={handleFormChange} type="number" />
                        <FormInput label="分潤保底 (TWD)" name="分潤保底" value={formData['分潤保底']} onChange={handleFormChange} type="number" />
                    </div>
                </div>
            );
            case 'free_event': return (
                <div key={sectionId} className="p-4 bg-gray-800/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4 border-b border-gray-700 pb-2">免單</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput label="免單期間" name="免單期間" value={formData['免單期間']} onChange={handleFormChange} />
                        <FormInput label="免單抽獎數量" name="免單抽獎數量" value={formData['免單抽獎數量']} onChange={handleFormChange} type="number" />
                        <FormInput label="免單單筆上限 (TWD)" name="免單單筆上限" value={formData['免單單筆上限']} onChange={handleFormChange} type="number" />
                    </div>
                </div>
            );
            case 'notes': return (
                <div key={sectionId} className="p-4 bg-gray-800/50 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-300 mb-4 border-b border-gray-700 pb-2">資料紀錄</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-400 mb-2 block">產品組合</label>
                            <div className="space-y-2">
                                {(formData['產品組合'] as ProductCombo[]).map((combo, index) => (
                                    <div key={combo.id} className="flex items-center gap-2">
                                        <input type="text" placeholder="組合名稱" value={combo.name} onChange={(e) => handleProductComboChange(index, 'name', e.target.value)} className="flex-grow bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"/>
                                        <input type="number" placeholder="優惠價" value={combo.price} onChange={(e) => handleProductComboChange(index, 'price', e.target.value)} className="w-32 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500"/>
                                        <button onClick={() => removeProductCombo(index)} className="p-2 text-red-400 hover:text-red-300 transition"><TrashIcon /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={addProductCombo} className="mt-2 text-sm text-blue-400 hover:text-blue-300 transition">+ 新增組合</button>
                        </div>
                        <FormInput label="已有商品" name="已有商品" value={formData['已有商品']} onChange={handleFormChange} isTextArea={true} />
                        <FormInput label="備註" name="備註" value={formData['備註']} onChange={handleFormChange} isTextArea={true} />
                    </div>
                </div>
            );
            default: return null;
        }
    };
    
    if (shareViewPayload) {
        return <SharedContractView payload={shareViewPayload} />;
    }

    return (
        <div className="min-h-screen container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <h1 className="text-4xl font-bold text-blue-300">動態合約生成器</h1>
                <p className="text-gray-400 mt-2">選擇模組、填寫資料、即可快速生成您的合作備忘錄</p>
            </header>

            <main className="space-y-6">
                <div className="p-4 bg-gray-800 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-200">1. 選擇合約模組</h2>
                     <div className="flex items-center gap-4 mb-4">
                        <input type="checkbox" id="select-all" checked={isAllSelected} onChange={handleSelectAll} className="h-4 w-4 rounded text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500"/>
                        <label htmlFor="select-all" className="font-medium text-gray-300">全選</label>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        {SECTIONS.map(section => (
                            <div key={section.id} className="relative flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id={section.id}
                                        type="checkbox"
                                        checked={!!selectedSections[section.id]}
                                        onChange={() => handleSectionToggle(section.id)}
                                        className="h-4 w-4 rounded text-blue-500 bg-gray-700 border-gray-600 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="ml-2 text-sm">
                                    <label htmlFor={section.id} className="font-medium text-gray-300 cursor-pointer">{section.label}</label>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-gray-800 rounded-lg shadow-lg">
                    <h2 className="text-xl font-semibold mb-4 text-gray-200">2. 填寫欄位資料</h2>
                    <div className="space-y-6">
                        {sectionsToDisplay.map(id => renderFormSection(id))}
                    </div>
                </div>
                
                <div className="text-center sticky bottom-4 z-10">
                    <button onClick={generateContractHandler} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg transform hover:scale-105 transition-all duration-300">
                        生成合約
                    </button>
                </div>
                
                <div className="p-4 bg-gray-800 rounded-lg shadow-lg">
                    <div className="border-b border-gray-700">
                        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                            <button onClick={() => setActiveTab('generate')} className={`${activeTab === 'generate' ? 'border-blue-400 text-blue-300' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}>
                                生成合約
                            </button>
                            <button onClick={() => setActiveTab('template')} className={`${activeTab === 'template' ? 'border-blue-400 text-blue-300' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}>
                                編輯範本
                            </button>
                        </nav>
                    </div>

                    <div className="pt-6">
                        {activeTab === 'generate' && (
                             <div>
                                {generatedContract ? (
                                    <>
                                        <div className="flex flex-wrap justify-end gap-2 mb-4">
                                            <button onClick={() => exportToDoc(generatedContract, 'contract')} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition">
                                                <DownloadIcon /> Word
                                            </button>
                                            <button onClick={() => exportToPdf('contract-output', 'contract')} className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition">
                                                <DownloadIcon /> PDF
                                            </button>
                                            <button onClick={handleCreateShareLink} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition">
                                                <ShareIcon /> 分享
                                            </button>
                                        </div>
                                        <div id="contract-output">
                                            <ContractRenderer content={generatedContract} />
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-center text-gray-500 py-10">點擊「生成合約」按鈕後，合約內容將會顯示於此。</p>
                                )}
                            </div>
                        )}
                        {activeTab === 'template' && (
                             <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="template-select" className="block text-sm font-medium text-gray-400 mb-1">選擇範本</label>
                                        <select id="template-select" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500">
                                            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="template-name" className="block text-sm font-medium text-gray-400 mb-1">範本名稱</label>
                                        <input type="text" id="template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </div>

                                <details className="mb-2 bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
                                    <summary className="p-3 cursor-pointer text-gray-300 font-medium hover:bg-gray-800/80 transition-colors">
                                        顯示/隱藏可用欄位佔位符
                                    </summary>
                                    <div className="p-4 border-t border-gray-700 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-gray-800/50">
                                        {placeholderList.map(({ key, label }) => (
                                            <button 
                                                key={key} 
                                                onClick={() => handlePlaceholderInsert(key)}
                                                className="text-left p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                title={`點擊以插入 {{${key}}}`}
                                            >
                                                <code className="font-mono text-blue-300 break-all">{`{{${key}}}`}</code>
                                                <p className="text-gray-400 text-xs mt-1">({label})</p>
                                            </button>
                                        ))}
                                    </div>
                                </details>

                                <div>
                                    <label htmlFor="template-content" className="block text-sm font-medium text-gray-400 mb-1">範本內容</label>
                                    <textarea 
                                        ref={templateContentRef}
                                        id="template-content" 
                                        rows={20} 
                                        value={templateContent} 
                                        onChange={(e) => setTemplateContent(e.target.value)} 
                                        className="w-full bg-gray-900 border border-gray-600 rounded-md p-3 text-gray-300 font-mono text-sm focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div className="flex flex-wrap gap-2 justify-end">
                                    <button onClick={saveNewTemplate} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition" type="button">另存為新範本</button>
                                    <button onClick={updateTemplate} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition disabled:bg-gray-500" disabled={defaultTemplateIds.includes(selectedTemplateId)} type="button">更新目前範本</button>
                                    <button onClick={deleteTemplate} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition disabled:bg-gray-500" disabled={defaultTemplateIds.includes(selectedTemplateId)} type="button">刪除目前範本</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;
