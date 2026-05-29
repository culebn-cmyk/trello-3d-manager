import React, { useState, useEffect, useRef } from "react";

import { Task } from "@/data/tasks";
import { uploadToDrive } from "@/utils/driveUpload";

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as data URL."));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const compressImageDataUrl = async (
  dataUrl: string,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const ratio = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
      const width = Math.round(image.width * ratio);
      const height = Math.round(image.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas is not supported."));
      ctx.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    image.onerror = () => reject(new Error("Failed to load image for compression."));
    image.src = dataUrl;
  });
};

const loadCompressedImage = async (file: File): Promise<string> => {
  const dataUrl = await readFileAsDataUrl(file);
  const maxBytes = 300000; // ~300KB safe target for each image
  if (file.size <= maxBytes) {
    return dataUrl;
  }
  return compressImageDataUrl(dataUrl, 1200, 1200, 0.65);
};

type Props = {
  task: Task;
  onClose: () => void;
};

export default function TaskModal({
  task,
  onClose,
}: Props) {
  // State untuk Checklist Kemajuan QC
  const [geometryChecks, setGeometryChecks] = useState<boolean[]>(Array(8).fill(false));
  const [objectChecks, setObjectChecks] = useState<boolean[]>(Array(3).fill(false));
  const [textureChecks, setTextureChecks] = useState<boolean[]>(Array(2).fill(false));
  const [exportChecks, setExportChecks] = useState<boolean[]>(Array(3).fill(false));

const handleSaveTextData = () => {
  console.log("Tombol diklik!"); // Cek apakah tombol benar-benar terhubung
  console.log("Current Notes:", generalNotes);
  console.log("Current Link:", gdriveLink);
  
  try {
    const key = `task_data_${task.id}`;
    const existingData = JSON.parse(localStorage.getItem(key) || "{}");
    
    const updatedData = {
      ...existingData,
      geometryChecks,
      objectChecks,
      textureChecks,
      exportChecks,
      notes: generalNotes,
      gdrive: gdriveLink,
      referenceImage,
      geometryNotes,
      objectNotes,
      textureNotes,
      exportNotes,
      geometryImages,
      objectImages,
      textureImages,
      exportImages,
    };
    
    localStorage.setItem(key, JSON.stringify(updatedData));
    console.log("Data berhasil disimpan ke:", key);
    alert("Data berhasil disimpan!"); 
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    alert("Terjadi kesalahan saat menyimpan!");
  }
};

  //

  // --- CONTOH MOCK DATA: Menggunakan data dari spreadsheet kamu jika data task kosong ---
  const currentLat = (task as any).lat || 37.4028;
  const currentLon = (task as any).lon || 127.1033;
  const currentHeight = (task as any).height || 49.3;
  const defaultGDrive = (task as any).gdriveLink || "";
  

  // State untuk Input Data (Notes & Link GDrive)
  const [generalNotes, setGeneralNotes] = useState<string>("");
  const [gdriveLink, setGdriveLink] = useState<string>("");
  const [referenceImage, setReferenceImage] = useState<string>("");
  const [geometryNotes, setGeometryNotes] = useState<string[]>(Array(8).fill(""));
  const [objectNotes, setObjectNotes] = useState<string[]>(Array(3).fill(""));
  const [textureNotes, setTextureNotes] = useState<string[]>(Array(2).fill(""));
  const [exportNotes, setExportNotes] = useState<string[]>(Array(3).fill(""));
  const [geometryImages, setGeometryImages] = useState<string[]>(Array(8).fill(""));
  const [objectImages, setObjectImages] = useState<string[]>(Array(3).fill(""));
  const [textureImages, setTextureImages] = useState<string[]>(Array(2).fill(""));
  const [exportImages, setExportImages] = useState<string[]>(Array(3).fill(""));
  const [isLoaded, setIsLoaded] = useState(false);
  const [referenceUploading, setReferenceUploading] = useState(false);
  const referenceInputRef = useRef<HTMLInputElement | null>(null);

useEffect(() => {
  setIsLoaded(false);

  const savedData = JSON.parse(localStorage.getItem(`task_data_${task.id}`) || "{}");

  if (savedData.notes !== undefined) {
    setGeneralNotes(String(savedData.notes));
  } else {
    setGeneralNotes("");
  }

  if (savedData.gdrive !== undefined) {
    setGdriveLink(String(savedData.gdrive));
  } else {
    setGdriveLink("");
  }

  if (Array.isArray(savedData.geometryChecks) && savedData.geometryChecks.length === 8) {
    setGeometryChecks(savedData.geometryChecks);
  } else {
    setGeometryChecks(Array(8).fill(false));
  }

  if (Array.isArray(savedData.objectChecks) && savedData.objectChecks.length === 3) {
    setObjectChecks(savedData.objectChecks);
  } else {
    setObjectChecks(Array(3).fill(false));
  }

  if (Array.isArray(savedData.textureChecks) && savedData.textureChecks.length === 2) {
    setTextureChecks(savedData.textureChecks);
  } else {
    setTextureChecks(Array(2).fill(false));
  }

  if (Array.isArray(savedData.exportChecks) && savedData.exportChecks.length === 3) {
    setExportChecks(savedData.exportChecks);
  } else {
    setExportChecks(Array(3).fill(false));
  }

  if (Array.isArray(savedData.geometryNotes) && savedData.geometryNotes.length === 8) {
    setGeometryNotes(savedData.geometryNotes.map(String));
  } else {
    setGeometryNotes(Array(8).fill(""));
  }

  if (Array.isArray(savedData.objectNotes) && savedData.objectNotes.length === 3) {
    setObjectNotes(savedData.objectNotes.map(String));
  } else {
    setObjectNotes(Array(3).fill(""));
  }

  if (Array.isArray(savedData.textureNotes) && savedData.textureNotes.length === 2) {
    setTextureNotes(savedData.textureNotes.map(String));
  } else {
    setTextureNotes(Array(2).fill(""));
  }

  if (Array.isArray(savedData.exportNotes) && savedData.exportNotes.length === 3) {
    setExportNotes(savedData.exportNotes.map(String));
  } else {
    setExportNotes(Array(3).fill(""));
  }

  if (Array.isArray(savedData.geometryImages) && savedData.geometryImages.length === 8) {
    setGeometryImages(savedData.geometryImages.map(String));
  } else {
    setGeometryImages(Array(8).fill(""));
  }

  if (Array.isArray(savedData.objectImages) && savedData.objectImages.length === 3) {
    setObjectImages(savedData.objectImages.map(String));
  } else {
    setObjectImages(Array(3).fill(""));
  }

  if (Array.isArray(savedData.textureImages) && savedData.textureImages.length === 2) {
    setTextureImages(savedData.textureImages.map(String));
  } else {
    setTextureImages(Array(2).fill(""));
  }

  if (Array.isArray(savedData.exportImages) && savedData.exportImages.length === 3) {
    setExportImages(savedData.exportImages.map(String));
  } else {
    setExportImages(Array(3).fill(""));
  }

  if (savedData.referenceImage !== undefined) {
    setReferenceImage(String(savedData.referenceImage));
  } else {
    setReferenceImage("");
  }

  setIsLoaded(true);
}, [task.id]);

useEffect(() => {
  if (!isLoaded) return;

  const dataToSave = {
    geometryChecks,
    objectChecks,
    textureChecks,
    exportChecks,
    notes: generalNotes,
    gdrive: gdriveLink,
    referenceImage,
    geometryNotes,
    objectNotes,
    textureNotes,
    exportNotes,
    geometryImages,
    objectImages,
    textureImages,
    exportImages,
  };

  try {
    localStorage.setItem(`task_data_${task.id}`, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Gagal menyimpan data ke localStorage:", error);
    alert("Storage penuh. Hapus beberapa gambar atau gunakan file berukuran lebih kecil.");
  }
}, [geometryChecks, objectChecks, textureChecks, exportChecks, generalNotes, gdriveLink, referenceImage, geometryNotes, objectNotes, textureNotes, exportNotes, geometryImages, objectImages, textureImages, exportImages, task.id, isLoaded]);


  // Kalkulasi Progress Bar
  const totalChecked =
    geometryChecks.filter(Boolean).length +
    objectChecks.filter(Boolean).length +
    textureChecks.filter(Boolean).length +
    exportChecks.filter(Boolean).length;

  const totalChecklist = 16;
  const overallProgress = Math.round((totalChecked / totalChecklist) * 100);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-6 z-50">
      <div className="bg-zinc-800 rounded-2xl w-full max-w-6xl p-6 relative max-h-[90vh] overflow-y-auto">
        
        {/* Tombol Close Modal */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-2xl"
        >
          ✕
        </button>

        {/* Header & Progress Bar Component */}
        <div className="flex items-start justify-between mb-6 gap-6">
          <div>
            <h2 className="text-3xl font-bold">
              {task.title || "SK Planet (QC Check)"}
            </h2>
            <div className="text-zinc-400 mt-2">
              Overall QC Progress
            </div>
          </div>

          <div className="min-w-[260px] bg-zinc-900 border border-zinc-700 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-300 text-sm">Progress</span>
              <span className="text-sm font-bold text-white">{overallProgress}%</span>
            </div>

            <div className="w-full h-3 bg-zinc-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>

            <div className="mt-2 text-sm text-zinc-400">
              {totalChecked}/{totalChecklist} checklist completed
            </div>
          </div>
        </div>

        {/* Grid Informasi Detail Task */}
        <div className="grid md:grid-cols-2 gap-4 text-zinc-300">
          <div>
            <strong>Map ID:</strong> {task.mapId || "63"}
          </div>

          {/* LINK GOOGLE MAPS AKTIF (Mengarah ke Titik Koordinat SK Planet) */}
          <div>
            <strong>Google Maps:</strong>{" "}
            {currentLat && currentLon ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${currentLat},${currentLon}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 hover:underline font-medium inline-flex items-center gap-1 text-sm"
              >
                📍 Lihat Lokasi ({currentLat}, {currentLon}) ↗
              </a>
            ) : (
              <span className="text-zinc-500 italic text-sm">Koordinat tidak tersedia</span>
            )}
          </div>

          <div>
            <strong>BDG ID:</strong> {task.bdgId || "14120315"}
          </div>

          <div>
            <strong>Name Join:</strong> {task.nameJoin || "SK플래닛 (SK Planet)"}
          </div>

          <div>
            <strong>Level:</strong> {task.level || "R2"}
          </div>

          <div>
            <strong>Assigned:</strong> {task.assignedTo || "Eza"}
          </div>

          <div>
            <strong>Due Date:</strong> {task.dueDate || "N/A"}
          </div>

          <div>
            <strong>Height:</strong> {currentHeight ? `${currentHeight} meters` : "15 meters"}
          </div>
        </div>

        {/* --- SECTION: GENERAL NOTES & GDRIVE --- */}
<div className="mt-8 grid md:grid-cols-2 gap-6">
  {/* Kolom General Notes */}
  <div>
    <div className="flex items-center justify-between mb-3 gap-4">
      <h3 className="text-xl font-bold">General Notes</h3>
      <button
        onClick={handleSaveTextData}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
      >
        Save Changes
      </button>
    </div>
    <textarea
      value={generalNotes}
      onChange={(e) => setGeneralNotes(e.target.value)}
      placeholder="Tulis catatan umum di sini..."
      className="w-full h-28 bg-zinc-900 rounded-xl p-4 border border-zinc-700 text-zinc-100 focus:outline-none focus:border-zinc-500 resize-none text-sm"
    />
  </div>

  {/* Kolom Project Folder Link */}
  <div>
    <h3 className="text-xl font-bold mb-3">Project Folder Link</h3>
    <div className="w-full h-28 bg-zinc-900 rounded-xl p-4 border border-zinc-700 flex flex-col justify-between gap-2">
      <input
        type="url"
        value={gdriveLink}
        onChange={(e) => setGdriveLink(e.target.value)}
        placeholder="Masukkan link Google Drive (https://...)"
        className="w-full bg-zinc-800 rounded-lg px-3 py-1.5 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-zinc-500"
      />
      
      <div className="flex items-center justify-between mt-1">
        {gdriveLink.startsWith("http") ? (
          <a
            href={gdriveLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1 font-medium truncate max-w-[280px]"
            title={gdriveLink}
          >
            📁 Buka Link GDrive ↗
          </a>
        ) : (
          <span className="text-zinc-500 text-xs italic">
            Masukkan URL yang valid
          </span>
        )}
      </div>
    </div>
  </div>
</div>

        {/* Section Reference Images */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-3">Reference Images</h3>
          <div className="grid gap-4 md:grid-cols-[1.5fr_1fr] items-center border-2 border-dashed border-zinc-600 rounded-2xl p-6">
            <div className="w-full h-64 bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700 flex items-center justify-center">
              {referenceImage ? (
                <img
                  src={referenceImage}
                  alt="Reference"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-zinc-500 px-4 text-center">
                  No reference image uploaded yet.
                </div>
              )}
            </div>
            <div className="flex flex-col justify-center gap-3">
              <p className="text-sm text-zinc-400">
                Upload one reference image for this task. Uploading again will replace the current image.
              </p>
              <button
                type="button"
                onClick={() => referenceInputRef.current?.click()}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={referenceUploading}
              >
                {referenceUploading ? "Uploading..." : "Upload reference image"}
              </button>
              {referenceImage ? (
                <button
                  type="button"
                  onClick={() => setReferenceImage("")}
                  className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Remove reference image
                </button>
              ) : null}
              <input
                ref={referenceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const input = e.target as HTMLInputElement;
                  const file = input.files?.[0];
                  if (!file) return;

                  setReferenceUploading(true);

                  loadCompressedImage(file)
                    .then((localImage) => {
                      setReferenceImage(localImage);
                      input.value = "";

                      // Upload to Google Drive in background
                      uploadToDrive(file)
                        .then((result) => {
                          if (result.success) {
                            console.log("Reference image uploaded to Drive:", result.url);
                          } else {
                            console.warn("Drive upload failed:", result.error);
                          }
                        })
                        .catch((err) => console.error("Drive upload error:", err))
                        .finally(() => setReferenceUploading(false));
                    })
                    .catch((err) => {
                      console.error("Reference image upload failed:", err);
                      alert("Gagal mengunggah gambar. Coba file lain atau gunakan ukuran lebih kecil.");
                      input.value = "";
                      setReferenceUploading(false);
                    });
                }}
              />
            </div>
          </div>
        </div>

        {/* --- GEOMETRY CHECKLIST --- */}
        <ChecklistSection
          title="Geometry Checklist"
          checkedCount={geometryChecks.filter(Boolean).length}
          totalCount={8}
        >
          <ChecklistItem
            title="Double-overlapping faces"
            description="Check if the faces are double-overlapping. If the faces are overlapping, z-fight occurs when zooming in/out (flickering phenomenon)"
            checked={geometryChecks[0]}
            note={geometryNotes[0]}
            imageUrl={geometryImages[0]}
            onChange={(value) => {
              const updated = [...geometryChecks];
              updated[0] = value;
              setGeometryChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...geometryNotes];
              updated[0] = value;
              setGeometryNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...geometryImages];
              updated[0] = value;
              setGeometryImages(updated);
            }}
          />

          <ChecklistItem
            title="Broken cotton parts"
            description="Check if there are any broken parts in the cotton"
            checked={geometryChecks[1]}
            note={geometryNotes[1]}
            imageUrl={geometryImages[1]}
            onChange={(value) => {
              const updated = [...geometryChecks];
              updated[1] = value;
              setGeometryChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...geometryNotes];
              updated[1] = value;
              setGeometryNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...geometryImages];
              updated[1] = value;
              setGeometryImages(updated);
            }}
          />

          <ChecklistItem
            title="Surface normals outside"
            description="Check if the direction (normal) of the surface is all outside"
            checked={geometryChecks[2]}
            note={geometryNotes[2]}
            imageUrl={geometryImages[2]}
            onChange={(value) => {
              const updated = [...geometryChecks];
              updated[2] = value;
              setGeometryChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...geometryNotes];
              updated[2] = value;
              setGeometryNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...geometryImages];
              updated[2] = value;
              setGeometryImages(updated);
            }}
          />

          <ChecklistItem
            title="Delete invisible surfaces"
            description="Delete unnecessary surfaces from invisible areas"
            checked={geometryChecks[3]}
            note={geometryNotes[3]}
            imageUrl={geometryImages[3]}
            onChange={(value) => {
              const updated = [...geometryChecks];
              updated[3] = value;
              setGeometryChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...geometryNotes];
              updated[3] = value;
              setGeometryNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...geometryImages];
              updated[3] = value;
              setGeometryImages(updated);
            }}
          />

          <ChecklistItem
            title="Polygon gaps"
            description="Check if there are gaps between polygons"
            checked={geometryChecks[4]}
            note={geometryNotes[4]}
            imageUrl={geometryImages[4]}
            onChange={(value) => {
              const updated = [...geometryChecks];
              updated[4] = value;
              setGeometryChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...geometryNotes];
              updated[4] = value;
              setGeometryNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...geometryImages];
              updated[4] = value;
              setGeometryImages(updated);
            }}
          />

          <ChecklistItem
            title="Edge processing"
            description="Check for edge processing (end processing, rounding processing, etc.)"
            checked={geometryChecks[5]}
            note={geometryNotes[5]}
            imageUrl={geometryImages[5]}
            onChange={(value) => {
              const updated = [...geometryChecks];
              updated[5] = value;
              setGeometryChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...geometryNotes];
              updated[5] = value;
              setGeometryNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...geometryImages];
              updated[5] = value;
              setGeometryImages(updated);
            }}
          />

          <ChecklistItem
            title="Loose geometry"
            description="Check if there is loose geometry"
            checked={geometryChecks[6]}
            note={geometryNotes[6]}
            imageUrl={geometryImages[6]}
            onChange={(value) => {
              const updated = [...geometryChecks];
              updated[6] = value;
              setGeometryChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...geometryNotes];
              updated[6] = value;
              setGeometryNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...geometryImages];
              updated[6] = value;
              setGeometryImages(updated);
            }}
          />

          <ChecklistItem
            title="Vertices under 65,536"
            description="Check if the number of vertices in the transmitted data is less than 65,536"
            checked={geometryChecks[7]}
            note={geometryNotes[7]}
            imageUrl={geometryImages[7]}
            onChange={(value) => {
              const updated = [...geometryChecks];
              updated[7] = value;
              setGeometryChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...geometryNotes];
              updated[7] = value;
              setGeometryNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...geometryImages];
              updated[7] = value;
              setGeometryImages(updated);
            }}
          />
        </ChecklistSection>

        {/* --- OBJECT CLASSIFICATION CHECKLIST --- */}
        <ChecklistSection
          title="Object Classification"
          checkedCount={objectChecks.filter(Boolean).length}
          totalCount={3}
        >
          <ChecklistItem
            title="Proper category"
            description="Make sure it is properly categorized as Wall / Window / Door / Logo / Roof"
            checked={objectChecks[0]}
            note={objectNotes[0]}
            imageUrl={objectImages[0]}
            onChange={(value) => {
              const updated = [...objectChecks];
              updated[0] = value;
              setObjectChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...objectNotes];
              updated[0] = value;
              setObjectNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...objectImages];
              updated[0] = value;
              setObjectImages(updated);
            }}
          />

          <ChecklistItem
            title="Door/logo complete"
            description="Check that the door and logo are built without any omissions in the actual location"
            checked={objectChecks[1]}
            note={objectNotes[1]}
            imageUrl={objectImages[1]}
            onChange={(value) => {
              const updated = [...objectChecks];
              updated[1] = value;
              setObjectChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...objectNotes];
              updated[1] = value;
              setObjectNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...objectImages];
              updated[1] = value;
              setObjectImages(updated);
            }}
          />

          <ChecklistItem
            title="Roof/wall usage"
            description="Check if the roof and wall are used appropriately on the rooftop"
            checked={objectChecks[2]}
            note={objectNotes[2]}
            imageUrl={objectImages[2]}
            onChange={(value) => {
              const updated = [...objectChecks];
              updated[2] = value;
              setObjectChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...objectNotes];
              updated[2] = value;
              setObjectNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...objectImages];
              updated[2] = value;
              setObjectImages(updated);
            }}
          />
        </ChecklistSection>

        {/* --- TEXTURE CHECKLIST --- */}
        <ChecklistSection
          title="Texture"
          checkedCount={textureChecks.filter(Boolean).length}
          totalCount={2}
        >
          <ChecklistItem
            title="AO texture configured"
            description="Ensure AO texture and node are configured"
            checked={textureChecks[0]}
            note={textureNotes[0]}
            imageUrl={textureImages[0]}
            onChange={(value) => {
              const updated = [...textureChecks];
              updated[0] = value;
              setTextureChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...textureNotes];
              updated[0] = value;
              setTextureNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...textureImages];
              updated[0] = value;
              setTextureImages(updated);
            }}
          />

          <ChecklistItem
            title="AO shape correct"
            description="Check if the AO shape is correct"
            checked={textureChecks[1]}
            note={textureNotes[1]}
            imageUrl={textureImages[1]}
            onChange={(value) => {
              const updated = [...textureChecks];
              updated[1] = value;
              setTextureChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...textureNotes];
              updated[1] = value;
              setTextureNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...textureImages];
              updated[1] = value;
              setTextureImages(updated);
            }}
          />
        </ChecklistSection>

        {/* --- EXPORT CHECKLIST --- */}
        <ChecklistSection
          title="Export"
          checkedCount={exportChecks.filter(Boolean).length}
          totalCount={3}
        >
          <ChecklistItem
            title="Exclude color elements"
            description="Make sure color-related elements are excluded"
            checked={exportChecks[0]}
            note={exportNotes[0]}
            imageUrl={exportImages[0]}
            onChange={(value) => {
              const updated = [...exportChecks];
              updated[0] = value;
              setExportChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...exportNotes];
              updated[0] = value;
              setExportNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...exportImages];
              updated[0] = value;
              setExportImages(updated);
            }}
          />

          <ChecklistItem
            title="Transforms reset"
            description="Check if all Transforms information has been reset (applied)"
            checked={exportChecks[1]}
            note={exportNotes[1]}
            imageUrl={exportImages[1]}
            onChange={(value) => {
              const updated = [...exportChecks];
              updated[1] = value;
              setExportChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...exportNotes];
              updated[1] = value;
              setExportNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...exportImages];
              updated[1] = value;
              setExportImages(updated);
            }}
          />

          <ChecklistItem
            title="Correct BDG_ID naming"
            description="Check that the file name and modeling name are entered with the corresponding BDG_ID"
            checked={exportChecks[2]}
            note={exportNotes[2]}
            imageUrl={exportImages[2]}
            onChange={(value) => {
              const updated = [...exportChecks];
              updated[2] = value;
              setExportChecks(updated);
            }}
            onNoteChange={(value) => {
              const updated = [...exportNotes];
              updated[2] = value;
              setExportNotes(updated);
            }}
            onImageChange={(value) => {
              const updated = [...exportImages];
              updated[2] = value;
              setExportImages(updated);
            }}
          />
        </ChecklistSection>
      </div>
    </div>
  );
}

// Sub-Komponen ChecklistItem
function ChecklistItem({
  title,
  description,
  checked,
  note,
  imageUrl,
  onChange,
  onNoteChange,
  onImageChange,
}: {
  title: string;
  description?: string;
  checked: boolean;
  note: string;
  imageUrl: string;
  onChange: (checked: boolean) => void;
  onNoteChange: (value: string) => void;
  onImageChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <>
      <div className="bg-zinc-900 rounded-xl border border-zinc-700 overflow-hidden">
        <div className="flex items-start justify-between p-3">
          <label className="flex items-start gap-3 flex-1">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className={`text-sm font-medium leading-snug ${checked ? "line-through text-zinc-500" : ""}`}>
                {title}
              </div>
            </div>
          </label>
          <button
            onClick={() => setOpen(!open)}
            className="ml-2 text-zinc-400 hover:text-white text-lg"
          >
            {open ? "−" : "+"}
          </button>
        </div>

        {open && (
          <div className="p-3 border-t border-zinc-700 bg-zinc-900/50">
            {description && (
              <div className="text-xs text-zinc-400 mb-3 leading-relaxed border-l-2 border-zinc-600 pl-2">
                {description}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-3">
              <textarea
                value={note}
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="Add notes..."
                className="w-full h-24 bg-zinc-800 rounded-lg p-3 border border-zinc-700 text-sm focus:outline-none"
              />
              <div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="w-full h-24 bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Checklist upload"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                        No image uploaded
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg px-3 py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload image"}
                  </button>
                  {imageUrl ? (
                    <button
                      type="button"
                      onClick={() => onImageChange("")}
                      className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-200 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                    >
                      Remove image
                    </button>
                  ) : null}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const input = e.target as HTMLInputElement;
                      const file = input.files?.[0];
                      if (!file) return;

                      setUploading(true);

                      loadCompressedImage(file)
                        .then((value) => {
                          onImageChange(value);
                          input.value = "";

                          // Upload to Google Drive in background
                          uploadToDrive(file)
                            .then((result) => {
                              if (result.success) {
                                console.log("Image uploaded to Drive:", result.url);
                              } else {
                                console.warn("Drive upload failed:", result.error);
                              }
                            })
                            .catch((err) => console.error("Drive upload error:", err))
                            .finally(() => setUploading(false));
                        })
                        .catch((err) => {
                          console.error("Checklist image upload failed:", err);
                          alert("Gagal mengunggah gambar. Coba file lain atau gunakan ukuran lebih kecil.");
                          input.value = "";
                          setUploading(false);
                        });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-10">
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white text-3xl"
          >
            ✕
          </button>
          <img src={selectedImage} className="max-w-full max-h-full rounded-2xl" />
        </div>
      )}
    </>
  );
}

// Sub-Komponen ChecklistSection
function ChecklistSection({
  title,
  checkedCount,
  totalCount,
  children,
}: {
  title: string;
  checkedCount: number;
  totalCount: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{title}</h3>
        <div className="text-sm bg-zinc-700 px-3 py-1 rounded-full text-zinc-300">
          {checkedCount}/{totalCount}
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}