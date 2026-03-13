import React, { useState } from "react";
import { useDropzone } from "react-dropzone";
import Lottie from "react-lottie";
import fantasyAnimation from "../assets/fantasy.json"; // your Lottie JSON file

const PdfUpload = () => {
  const [file, setFile] = useState(null);

  const onDrop = (acceptedFiles) => {
    const pdf = acceptedFiles[0];
    setFile(pdf);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: fantasyAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-gradient-to-b from-purple-900 to-indigo-800 overflow-hidden">
      {/* Lottie Background */}
      <div className="absolute w-full h-full top-0 left-0 opacity-40 pointer-events-none">
        <Lottie options={defaultOptions} />
      </div>

      {/* Magical Particle Overlay */}
      <div className="absolute w-full h-full top-0 left-0 pointer-events-none">
        <div className="w-full h-full bg-[radial-gradient(circle,_rgba(255,255,255,0.1)_1px,_transparent_1px)] bg-[length:20px_20px] animate-pulse" />
      </div>

      {/* Upload Box */}
      <div
        {...getRootProps()}
        className={`z-10 w-80 h-60 flex flex-col items-center justify-center border-4 border-dashed rounded-3xl p-4 transition-all shadow-lg 
          ${
            isDragActive
              ? "border-yellow-400 bg-yellow-100/20 animate-pulse"
              : "border-white/40 hover:border-purple-400 hover:shadow-[0_0_20px_#a78bfa]"
          }`}
      >
        <input {...getInputProps()} />
        {!file ? (
          <>
            <p className="text-white text-center font-semibold mb-2">
              Drag & Drop your character sheet here
            </p>
            <p className="text-sm text-white/70">or click to browse</p>
          </>
        ) : (
          <p className="text-white font-bold">{file.name}</p>
        )}
      </div>
    </div>
  );
};

export default PdfUpload;

