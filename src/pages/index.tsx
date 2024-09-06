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
  const [loadedImgSize, setLoadedImgSize] = React.useState<{ width: number, height: number } | null>(null);
  const [loadedAspectRatio, setLoadedAspectRatio] = React.useState<number | null>(null);
  const [sliderValue, setSliderValue] = React.useState<number>(0);
  const [currentFile, setCurrentFile] = React.useState<File | null>(null);
  const [resizedFileSize, setResizedFileSize] = React.useState<number | null>(null);
  const [outputFormat, setOutputFormat] = React.useState<"image/png" | "image/jpeg">("image/png");

  React.useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = Array.from(event.clipboardData?.items || []);
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            loadImg(file);
          }
        }
      }
    };

    const handleCopy = async (event: ClipboardEvent) => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            const item = new ClipboardItem({ [blob.type]: blob });
            await navigator.clipboard.write([item]);
            console.log("copied to clipboard!");
          }
        }, outputFormat, outputFormat === "image/jpeg" ? 0.9 : undefined);
        event.preventDefault();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "v") {
        event.preventDefault();
        navigator.clipboard.read().then(items => {
          for (const item of items) {
            if (item.types.includes("image/png") || item.types.includes("image/jpeg")) {
              item.getType("image/png").then((blob) => {
                const file = new File([blob], "from-clipboard-image.png", { type: blob.type });
                loadImg(file);
              });
            }
          }
        });
      }

      if (event.ctrlKey && event.key === "c") {
        handleCopy(new ClipboardEvent("copy"));
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("paste", handlePaste);
    };
  }, [outputFormat]);

  const loadImg = (file: File) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
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
        img.src = URL.createObjectURL(file);
        setCurrentFile(file);
        setIsDragging(false);
      }
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    loadImg(event.dataTransfer.files[0]);
  };

  const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.currentTarget.files;
    if (!files || files?.length === 0) return;
    loadImg(files[0]);
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

        const quality = outputFormat === "image/jpeg" ? 0.9 : undefined;
        const resizedImgData = canvas.toDataURL(outputFormat, quality);

        const base64Length = resizedImgData.length - (resizedImgData.indexOf(",") + 1);
        const padding = resizedImgData.endsWith("==") ? 2 : resizedImgData.endsWith("=") ? 1 : 0;
        const fileSizeInBytes = base64Length * 0.75 - padding;

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
      const formatExtension = outputFormat === "image/jpeg" ? "jpg" : "png";
      link.download = `${currentFile?.name}_(${sliderValue}x${Math.trunc(sliderValue / loadedAspectRatio!)})_resized.${formatExtension}`;
      link.href = canvas.toDataURL(outputFormat, outputFormat === "image/jpeg" ? 0.9 : undefined);
      link.click();
    }
  };

  return (
    <main className="w-full h-[100svh] flex flex-col select-none">
      <div className="h-16 px-4 bg-red-50 flex flex-col items-center justify-center">
        <h1 className="text-center leading-8 text-3xl text-red-400">
          <b>画像の縮小化</b>
        </h1>
        <p className="leading-4"><small>&copy; isirmt</small></p>
      </div>
      <div className="h-[calc(100svh_-_16rem)] flex flex-col justify-center items-center gap-y-3 relative w-full">
        <div
          className={`w-full h-full flex flex-col justify-center items-center p-6 border-red-400 border-y mx-4 ${isDragging ? "bg-red-50" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
        >
          <canvas ref={canvasRef} width={500} height={500} className={`max-w-full max-h-full ${!currentFile ? "hidden" : ""}`}></canvas>
          {!currentFile
            ? <>
              <img className="max-w-full max-h-full" src="/back_transparent.png" alt="icon"></img>
              <p className="text-red-400 text-center text-lg"><b>画像をドラッグ&ドロップ<br />または下より選択<br />または&nbsp;貼り付け[Ctrl(Cmd)+V]</b></p>
            </>
            : <></>}
        </div>
      </div>

      <div className="h-48 px-4 bg-red-50 flex flex-col items-center justify-center">
        <input
          onChange={handleInput}
          type="file" accept="image/*"
          className="mb-1 relative m-0 block min-w-0 cursor-pointer rounded border border-solid border-red-300 bg-transparent bg-clip-padding px-3 py-0.5 text-red-400 font-bold file:-mx-3 file:-my-1 file:me-3 file:cursor-pointer file:overflow-hidden file:rounded-none file:border-0 file:border-e file:text-red-400 file:border-solid file:border-inherit file:bg-red-100 file:px-3 file:py-0.5 focus:outline-none file:focus:bg-red-200" />
        {loadedImgSize ? (
          <>
            <div className="flex gap-2 text-sm text-red-400">
              <span><b>前:</b></span>
              <span><b>ファイルサイズ：{formatFileSize(currentFile?.size!)}</b></span>
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
                onTouchEnd={handleResize}
                className="transparent h-[4px] w-full cursor-pointer appearance-none border-transparent bg-red-200"
              />
            </div>
            <div className="flex gap-2 text-sm text-red-400">
              <span><b>後:</b></span>
              {resizedFileSize && <span><b>ファイルサイズ：{formatFileSize(resizedFileSize)}</b></span>}
              <span><b>画像サイズ：[{sliderValue} x {Math.trunc(sliderValue / loadedAspectRatio!)}]</b></span>
            </div>
            <div className="flex gap-2 text-sm text-red-400">
              <label htmlFor="format-select"><b>出力形式</b></label>
              <select
                id="format-select"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as "image/png" | "image/jpeg")}
                className="border rounded"
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
              </select>
            </div>
            <div className="mt-2 flex gap-2 items-center justify-center">
              <button
                type="button"
                onClick={handleDownload}
                className="transition-colors px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500"
              >
                <b>ダウンロード</b>
              </button>
              <div className=" text-sm text-red-400"><b>コピー<br />[Ctrl(Cmd)+C]</b></div>
            </div>
          </>
        ) : <></>}
      </div>
    </main>
  );
};

export const Head: HeadFC = () => {
  return <>
    <title>画像の縮小化</title>
    <meta name="description" content="画像を特定のファイルサイズまで落とすために利用可能です。" />
    <meta name="keywords" content="image,resize" />
    <meta property="og:url" content="https://img-sm.isirmt.com" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="画像の縮小化" />
    <meta property="og:description" content="画像を特定のファイルサイズまで落とすために利用可能です。" />
    <meta property="og:site_name" content="isirmt ミニアプリ" />
    <meta property="og:image" content="https://img-sm.isirmt.com/ogp.png" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@isirmt" />
  </>
};
