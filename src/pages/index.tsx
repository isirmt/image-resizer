import * as React from "react";
import type { HeadFC } from "gatsby";

function formatFileSize(sizeInBytes: number): string {
  const units = ["B", "kB", "MB", "GB", "TB"];
  let size = sizeInBytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export default function App() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = React.useState<boolean>(false);
  const [loadedFileSize, setLoadedFileSize] = React.useState<number | null>(null);
  const [loadedImgSize, setLoadedImgSize] = React.useState<{ width: number, height: number } | null>(null);
  const [loadedAspectRatio, setLoadedAspectRatio] = React.useState<number | null>(null);
  const [sliderValue, setSliderValue] = React.useState<number>(0);
  const [currentFile, setCurrentFile] = React.useState<File | null>(null);
  const [resizedFileSize, setResizedFileSize] = React.useState<number | null>(null);

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const files = event.dataTransfer.files;
        if (files.length > 0) {
          const img = new Image();
          img.onload = () => {
            const { width: imgWidth, height: imgHeight } = img;
            setLoadedImgSize({ width: imgWidth, height: imgHeight });

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const aspectRatio = imgWidth / imgHeight;
            setLoadedAspectRatio(aspectRatio);
            const fileHeight = canvas.width / aspectRatio;

            if (fileHeight > canvas.height) {
              const drawHeight = canvas.height;
              const drawWidth = canvas.height * aspectRatio;
              ctx.drawImage(img, (canvas.width - drawWidth) / 2, 0, drawWidth, drawHeight);
            } else {
              const drawWidth = canvas.width;
              const drawHeight = canvas.width / aspectRatio;
              ctx.drawImage(img, 0, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
            }

            setSliderValue(imgWidth);
          };
          img.src = URL.createObjectURL(files[0]);
          setCurrentFile(files[0]);
          setLoadedFileSize(files[0].size);
        }
        setIsDragging(false);
      }
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleResize = () => {
    if (!currentFile || !loadedAspectRatio) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = sliderValue;
        canvas.height = sliderValue / loadedAspectRatio;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const resizedImgData = canvas.toDataURL("image/png");

        // Calculate the size of the resized image data URL
        const base64Length = resizedImgData.length - (resizedImgData.indexOf(',') + 1);
        const padding = (resizedImgData.endsWith('==')) ? 2 : (resizedImgData.endsWith('=')) ? 1 : 0;
        const fileSizeInBytes = (base64Length * 0.75) - padding;

        setResizedFileSize(fileSizeInBytes);

        const mainCanvas = canvasRef.current;
        if (mainCanvas) {
          const mainCtx = mainCanvas.getContext("2d");
          mainCanvas.width = sliderValue;
          mainCanvas.height = sliderValue / loadedAspectRatio;
          mainCtx?.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
          mainCtx?.drawImage(img, 0, 0, mainCanvas.width, mainCanvas.height);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(currentFile);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const link = document.createElement("a");
      link.download = `${currentFile?.name}_(${sliderValue}x${Math.trunc(sliderValue / loadedAspectRatio!)})_resized.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <main className="w-full h-[100svh] flex flex-col select-none">
      <div className="h-16 px-4 bg-red-50 flex flex-col items-center justify-center">
        <h1 className="text-center text-3xl text-red-400">
          <b>画像リサイズ</b>
        </h1>
      </div>
      <div className="h-[calc(100svh_-_14rem)] flex flex-col justify-center items-center gap-y-3 relative w-full">
        <div
          className={`w-full h-full flex flex-col justify-center items-center p-6 border-red-400 border-y mx-4 ${isDragging ? "bg-red-50" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
        >
          <canvas ref={canvasRef} width={500} height={500} className=" max-w-full max-h-full"></canvas>
        </div>
      </div>

      <div className="h-40 px-4 bg-red-50 flex flex-col items-center justify-center">
        {loadedFileSize && loadedImgSize && (
          <>
            <div className="flex gap-2 text-sm text-red-400">
              <span><b>ファイルサイズ：{formatFileSize(loadedFileSize)}</b></span>
              <span><b>画像サイズ：[{loadedImgSize.width} x {loadedImgSize.height}]</b></span>
            </div>
            <div className="w-[80%]">
              <input
                type="range"
                min="1"
                max={loadedImgSize.width}
                value={sliderValue}
                onChange={(e) => setSliderValue(Number(e.target.value))}
                onMouseUp={handleResize}
                className="w-full"
              />
            </div>
            <div className="flex gap-2 text-sm text-red-400">
              {resizedFileSize && <span><b>ファイルサイズ：{formatFileSize(resizedFileSize)}</b></span>}
              <span><b>画像サイズ：[{sliderValue} x {Math.trunc(sliderValue / loadedAspectRatio!)}]</b></span>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="transition-colors mt-4 px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500"
            >
              ダウンロード
            </button>
          </>
        )}
      </div>

    </main>
  );
}

export const Head: HeadFC = () => <title>画像の縮小化</title>;
