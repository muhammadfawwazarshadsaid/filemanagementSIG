"use client";

import axios, { AxiosProgressEvent, CancelTokenSource } from "axios";
import {
  AudioWaveform,
  File as FileIcon,
  FileImage,
  FolderArchive,
  UploadCloud,
  Video,
  X,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { ScrollArea } from "./ui/scroll-area";
import { Input } from "./ui/input";
import ProgressBar from "./ui/progress";

interface FileUploadProgress {
  progress: number;
  File: File;
  source: CancelTokenSource | null;
}

function getFileIcon(filename: string): string {
  const extension = filename.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'doc':
    case 'docx':
    case 'docs':
      return '/word.svg';
    case 'ppt':
    case 'pptx':
      return '/ppt.svg';
    case 'pdf':
      return '/pdf.svg';
    case 'xls':
    case 'xlsx':
      return '/xlsx.svg';
    case 'txt':
      return '/txt.svg';
    case 'zip':
      return '/zip.svg';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return '/picture.svg';
    case 'mp4':
    case 'avi':
    case 'mov':
      return '/video.svg';
    case 'mp3':
    case 'wav':
      return '/music.svg';
    case 'html':
    case 'htm':
    case 'php':
    case 'asp':
      return '/web.svg';
    default:
      return '/file.svg';
  }
}

export default function ImageUpload() {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [filesToUpload, setFilesToUpload] = useState<FileUploadProgress[]>([]);

  const onUploadProgress = (
    progressEvent: AxiosProgressEvent,
    file: File,
    cancelSource: CancelTokenSource
  ) => {
    const progress = Math.round(
      (progressEvent.loaded / (progressEvent.total ?? 0)) * 100
    );

    if (progress === 100) {
      setUploadedFiles((prevUploadedFiles) => {
        return [...prevUploadedFiles, file];
      });

      setFilesToUpload((prevUploadProgress) => {
        return prevUploadProgress.filter((item) => item.File !== file);
      });

      return;
    }

    setFilesToUpload((prevUploadProgress) => {
      return prevUploadProgress.map((item) => {
        if (item.File.name === file.name) {
          return {
            ...item,
            progress,
            source: cancelSource,
          };
        } else {
          return item;
        }
      });
    });
  };

  const uploadImageToCloudinary = async (
    formData: FormData,
    onUploadProgress: (progressEvent: AxiosProgressEvent) => void,
    cancelSource: CancelTokenSource
  ) => {
    return axios.post(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUD_NAME}/image/upload`,
      formData,
      {
        onUploadProgress,
        cancelToken: cancelSource.token,
      }
    );
  };

  const removeFile = (file: File) => {
    setFilesToUpload((prevUploadProgress) => {
      return prevUploadProgress.filter((item) => item.File !== file);
    });

    setUploadedFiles((prevUploadedFiles) => {
      return prevUploadedFiles.filter((item) => item !== file);
    });
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setFilesToUpload((prevUploadProgress) => {
      return [
        ...prevUploadProgress,
        ...acceptedFiles.map((file) => {
          return {
            progress: 0,
            File: file,
            source: null,
          };
        }),
      ];
    });

    // cloudinary upload
    // const fileUploadBatch = acceptedFiles.map((file) => {
    //   const formData = new FormData();
    //   formData.append("file", file);
    //   formData.append(
    //     "upload_preset",
    //     process.env.NEXT_PUBLIC_UPLOAD_PRESET as string
    //   );

    //   const cancelSource = axios.CancelToken.source();
    //   return uploadImageToCloudinary(
    //     formData,
    //     (progressEvent) => onUploadProgress(progressEvent, file, cancelSource),
    //     cancelSource
    //   );
    // });

    // try {
    //   await Promise.all(fileUploadBatch);
    //   alert("All files uploaded successfully");
    // } catch (error) {
    //   console.error("Error uploading files: ", error);
    // }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="">
      <div>
        <label
          {...getRootProps()}
          className="relative flex flex-col items-center justify-center w-full py-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 "
        >
          <div className=" text-center">
            <div className=" border p-2 rounded-md max-w-min mx-auto">
              <UploadCloud size={20} />
            </div>

            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Drag files</span>
            </p>
            <p className="text-xs text-gray-500">
              Click to upload files &#40;files should be under 10 MB &#41;
            </p>
          </div>
        </label>

        <Input
          {...getInputProps()}
          id="dropzone-file"
          type="file"
          className="hidden"
        />
      </div>

      <div className="flex-1">
      {filesToUpload.length > 0 && (
        <div>
          <ScrollArea className="h-40">
            <p className="font-medium my-2 mt-6 text-muted-foreground text-sm">
              Files to upload
            </p>
            <div className="space-y-2 pr-3">
              {filesToUpload.map((fileUploadProgress) => {
                return (
                  <div
                    key={fileUploadProgress.File.lastModified}
                    className="flex justify-between gap-2 rounded-lg overflow-hidden border border-slate-100 group hover:pr-0 pr-2"
                  >
                    <div className="flex items-center flex-1 p-2">
                      <div className="text-white">
                        <img src={getFileIcon(fileUploadProgress.File.name)} alt="File Icon" className="w-10 h-10" />
                      </div>

                      <div className="w-full ml-2 space-y-1">
                        <div className="text-sm flex justify-between">
                          <p className="text-muted-foreground ">
                            {fileUploadProgress.File.name.slice(0, 25)}
                          </p>
                          <span className="text-xs">
                            {fileUploadProgress.progress}%
                          </span>
                        </div>
                        <ProgressBar
                          progress={fileUploadProgress.progress}
                          className="bg-gray-400" // Default color for progress bar
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (fileUploadProgress.source)
                          fileUploadProgress.source.cancel("Upload cancelled");
                        removeFile(fileUploadProgress.File);
                      }}
                      className="bg-red-500 text-white transition-all items-center justify-center cursor-pointer px-2 hidden group-hover:flex"
                    >
                      <X size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {uploadedFiles.length > 0 && (
        <div>
          <p className="font-medium my-2 mt-6 text-muted-foreground text-sm">
            Uploaded Files
          </p>
          <div className="space-y-2 pr-3">
            {uploadedFiles.map((file) => {
              return (
                <div
                  key={file.lastModified}
                  className="flex justify-between gap-2 rounded-lg overflow-hidden border border-slate-100 group hover:pr-0 pr-2 hover:border-slate-300 transition-all"
                >
                  <div className="flex items-center flex-1 p-2">
                    <div className="text-white">
                      <img src={getFileIcon(file.name)} alt="File Icon" className="w-10 h-10" />
                    </div>
                    <div className="w-full ml-2 space-y-1">
                      <div className="text-sm flex justify-between">
                        <p className="text-muted-foreground ">
                          {file.name.slice(0, 25)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file)}
                    className="bg-red-500 text-white transition-all items-center justify-center px-2 hidden group-hover:flex"
                  >
                    <X size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        )}
        </div>
    </div>
  );
}