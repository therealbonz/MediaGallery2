import UploadDropzone from "../UploadDropzone";

export default function UploadDropzoneExample() {
  const handleUpload = (files: File[]) => {
    console.log("Files uploaded:", files);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <UploadDropzone onUploaded={handleUpload} />
    </div>
  );
}
