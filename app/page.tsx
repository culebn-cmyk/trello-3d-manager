"use client";

import { useMemo, useState, useEffect } from "react";
import TaskModal from "@/components/TaskModal";
import { Task, Columns, initialColumns, SPREADSHEET_API_URL } from "@/data/tasks";

export default function Home() {
  const [archivedIds, setArchivedIds] = useState<string[]>([]);

useEffect(() => {
  const saved = localStorage.getItem("my_local_archive");
  if (saved) setArchivedIds(JSON.parse(saved));
}, []);

// Fungsi untuk mengarsipkan secara lokal
const archiveTaskLocally = (id: string) => {
  const newIds = [...archivedIds, id];
  setArchivedIds(newIds);
  localStorage.setItem("my_local_archive", JSON.stringify(newIds));
};
const unarchiveTaskLocally = (id: string) => {
  const newIds = archivedIds.filter((item) => item !== id);
  setArchivedIds(newIds);
  localStorage.setItem("my_local_archive", JSON.stringify(newIds));
};
  const [columns, setColumns] = useState<Columns>(initialColumns);
  const [unassignedTasks, setUnassignedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [sourceColumn, setSourceColumn] = useState<string>("");
  const [selectedUser, setSelectedUser] = useState("All");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // State Kontrol Tampilan Full Screen Modal (Menggantikan Drawer image_f07c04.png)
  const [showUnassignedFull, setShowUnassignedFull] = useState<boolean>(false);
  const [showArchiveFull, setShowArchiveFull] = useState<boolean>(false);
  
  const [searchUnassigned, setSearchUnassigned] = useState<string>("");
  const [searchArchive, setSearchArchive] = useState<string>("");

  // Daftar master nama modeler yang bisa ditambah sebanyak mungkin ke depannya
  const masterModelers = [
  "Agnn", "Ajeng", "Aldi", "Alif", "Andrei", "Arkan", "Aini", 
  "Budi", "Chandra", "Dewi", "Eko", "Eulia", "Faishal", "Fakhri", 
  "Lutfhi", "Malika", "Miko", "Naila", "Nanda", "Nandito", "Nando", 
  "Raihan", "Rizky", "Saka", "Salsa", "SMK", "Sadewa", "Syahid", 
  "Tiara", "Yudha", "Yudis"
].sort(); //

  // --- AMBIL DATA DARI SPREADSHEET (GET) ---
  const fetchSpreadsheetData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      
      const response = await fetch(SPREADSHEET_API_URL, { method: "GET" });
      if (!response.ok) throw new Error(`HTTP Error! Status: ${response.status}`);

      const rawTasks = await response.json();

      if (Array.isArray(rawTasks)) {
        const updatedColumns: Columns = {
          TODO: [],
          WIP_BLENDER: [],
          WIP_REVIT: [],
          REVIEW: [],
          DONE_BLENDER: [],
          DONE_REVIT: []
        };
        const unassignedList: Task[] = [];

        rawTasks.forEach((taskFromSheet: any) => {
          const currentStatus = (taskFromSheet.status || "Todo").trim();
          const upperStatus = currentStatus.toUpperCase();
          const assignedModeler = (taskFromSheet.assignedTo || "—").trim();

          const formattedTask: Task = {
            id: taskFromSheet.id ? String(taskFromSheet.id) : String(Math.random()),
            title: taskFromSheet.title || "No Name",
            level: taskFromSheet.level || "—",
            assignedTo: taskFromSheet.assignedTo || "—",
            dueDate: taskFromSheet.dueDate || "—",
            priority: "Medium",
            mapId: taskFromSheet.mapId || "—",
            bdgId: taskFromSheet.bdgId || "—",
            nameJoin: taskFromSheet.nameJoin || "—",
            notes: taskFromSheet.notes || "",
            image: taskFromSheet.image || "",
            status: currentStatus, 
            lat: taskFromSheet.lat || null,
            lon: taskFromSheet.lon || null,
            height: taskFromSheet.height || null,
          };

          // Jika status Todo/Kosong DAN belum di-assign, masuk ke Pool Unassigned
          if ((upperStatus === "TODO" || upperStatus === "") && (assignedModeler === "" || assignedModeler === "—")) {
            unassignedList.push(formattedTask);
          } else {
            if (upperStatus === "WIP BLENDER") {
              updatedColumns.WIP_BLENDER.push(formattedTask);
            } else if (upperStatus === "WIP REVIT") {
              updatedColumns.WIP_REVIT.push(formattedTask);
            } else if (upperStatus.includes("REVIEW") || upperStatus.includes("QC")) {
              updatedColumns.REVIEW.push(formattedTask);
            } else if (upperStatus === "DONE BLENDER") {
              updatedColumns.DONE_BLENDER.push(formattedTask);
            } else if (upperStatus === "DONE REVIT") {
              updatedColumns.DONE_REVIT.push(formattedTask);
            } else {
              updatedColumns.TODO.push(formattedTask);
            }
          }
        });

        setColumns(updatedColumns);
        setUnassignedTasks(unassignedList);
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Gagal mengambil data dari Spreadsheet.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpreadsheetData();
  }, []);

  // --- AKSI RE-ASSIGN & UNASSIGN (Kombinasi Pool & Board Utama) ---
  async function updateTaskModeler(task: Task, currentColumn: string | null, targetModeler: string) {
    const isUnassigning = targetModeler === "—" || targetModeler === "";

    // 1. Jika Diubah ke Unassigned dari Board Utama
    if (isUnassigning && currentColumn) {
      const updatedTask = { ...task, assignedTo: "—", status: "Todo" };
      setColumns((prev) => ({
        ...prev,
        [currentColumn]: prev[currentColumn].filter((t) => t.id !== task.id),
      }));
      setUnassignedTasks((prev) => [...prev, updatedTask]);
    } 
    // 2. Jika Di-assign dari Pool Unassigned ke Modeler
    else if (!currentColumn && !isUnassigning) {
      const updatedTask = { ...task, assignedTo: targetModeler, status: "Todo" };
      setUnassignedTasks((prev) => prev.filter((t) => t.id !== task.id));
      setColumns((prev) => ({
        ...prev,
        TODO: [...prev.TODO, updatedTask]
      }));
    } 
    // 3. Jika Hanya Ganti Nama Modeler di Board Utama
    else if (currentColumn && !isUnassigning) {
      setColumns((prev) => ({
        ...prev,
        [currentColumn]: prev[currentColumn].map((t) => 
          t.id === task.id ? { ...t, assignedTo: targetModeler } : t
        ),
      }));
    }

    try {
      await fetch(SPREADSHEET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          bdgId: task.bdgId,
          assignedTo: targetModeler,
          status: isUnassigning ? "Todo" : task.status
        }),
      });
    } catch (err) {
      console.error("Gagal sinkronisasi update modeler:", err);
    }
  }

  function handleDragStart(task: Task, columnName: string) {
    setDraggedTask(task);
    setSourceColumn(columnName);
  }

  async function handleDrop(targetColumn: string) {
    if (!draggedTask) return;
    if (sourceColumn === targetColumn) return;

    let newStatusText = "Todo";
    if (targetColumn === "WIP_BLENDER") newStatusText = "WIP Blender";
    else if (targetColumn === "WIP_REVIT") newStatusText = "WIP Revit";
    else if (targetColumn === "REVIEW") newStatusText = "Review";
    else if (targetColumn === "DONE_BLENDER") newStatusText = "Done Blender";
    else if (targetColumn === "DONE_REVIT") newStatusText = "Done Revit";

    const updatedTask = { ...draggedTask, status: newStatusText };
    setColumns((prev) => ({
      ...prev,
      [sourceColumn]: prev[sourceColumn].filter((t) => t.id !== draggedTask.id),
      [targetColumn]: [...prev[targetColumn], updatedTask],
    }));

    try {
      await fetch(SPREADSHEET_API_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ bdgId: draggedTask.bdgId, status: newStatusText }),
      });
    } catch (err) {
      console.error("Gagal sinkronisasi status:", err);
    }

    setDraggedTask(null);
  }

  const activeUsersFilter = useMemo(() => {
    const allUsers = Object.values(columns).flat().map((t) => t.assignedTo);
    return ["All", ...new Set(allUsers.filter(u => u !== "—"))];
  }, [columns]);

const mainColumns = useMemo(() => {
  const filterOutArchived = (tasks: Task[]) =>
    tasks.filter((t) => !archivedIds.includes(t.id));

  return {
    TODO: filterOutArchived(columns.TODO),
    WIP_BLENDER: filterOutArchived(columns.WIP_BLENDER),
    WIP_REVIT: filterOutArchived(columns.WIP_REVIT),
    REVIEW: filterOutArchived(columns.REVIEW),
    DONE_BLENDER: filterOutArchived(columns.DONE_BLENDER).slice(-6),
    DONE_REVIT: filterOutArchived(columns.DONE_REVIT).slice(-6),
  };
}, [columns, archivedIds]);

const archivedTasks = useMemo(() => {
  const allDone = [...columns.DONE_BLENDER, ...columns.DONE_REVIT];
  return allDone.filter((t) => archivedIds.includes(t.id));
}, [columns, archivedIds]);

  const filteredUnassigned = useMemo(() => {
    return unassignedTasks.filter(t => 
      t.title.toLowerCase().includes(searchUnassigned.toLowerCase()) || 
      t.bdgId.toLowerCase().includes(searchUnassigned.toLowerCase())
    );
  }, [unassignedTasks, searchUnassigned]);

  const filteredArchive = useMemo(() => {
    return archivedTasks.filter(t => 
      t.title.toLowerCase().includes(searchArchive.toLowerCase()) || 
      t.bdgId.toLowerCase().includes(searchArchive.toLowerCase()) ||
      t.assignedTo.toLowerCase().includes(searchArchive.toLowerCase())
    );
  }, [archivedTasks, searchArchive]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center text-zinc-400">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xl font-black">Sebats bentaran...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-900 text-white p-6 selection:bg-sky-500/30 w-full overflow-x-hidden flex flex-col relative">
      
      {/* Header Workspace */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-zinc-800 w-full">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100">TMT Task Tracker</h1>
          <p className="text-base text-zinc-400 mt-1">Sistem Distribusi & Manajemen Pekerjaan</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            onClick={() => setShowUnassignedFull(true)} 
            className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 text-sm px-4 py-2 rounded-lg border border-amber-800/80 font-black transition-all flex items-center gap-2"
          >
            📋 Pool Unassigned 
            <span className="bg-amber-500 text-zinc-950 text-xs px-1.5 py-0.5 rounded-md font-black">{unassignedTasks.length}</span>
          </button>

          <button 
            onClick={() => setShowArchiveFull(true)} 
            className="bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 text-sm px-4 py-2 rounded-lg border border-amber-800/80 font-black transition-all flex items-center gap-2"
          >
            📦 Arsip Done
            <span className="bg-amber-500 text-zinc-950 text-xs px-1.5 py-0.5 rounded-md font-black">{unassignedTasks.length}</span>
          </button>

          <div className="h-6 w-[1px] bg-zinc-800 mx-1 hidden sm:block"></div>

          <button onClick={fetchSpreadsheetData} className="bg-zinc-800 hover:bg-zinc-700 text-sm px-4 py-2 rounded-lg border border-zinc-700 font-bold transition-all">🔄 Refresh</button>
          
          <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-4 py-2 text-sm font-bold focus:outline-none focus:border-sky-500">
            {activeUsersFilter.map((u) => <option key={u} value={u}>{u === "All" ? "Semua Modeler Aktif" : u}</option>)}
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-950/40 border border-red-800 text-red-400 p-3 rounded-xl text-sm mb-4">⚠️ {errorMessage}</div>
      )}

      {/* Grid Kanban Board Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 items-start w-full flex-1">
        {Object.entries(mainColumns).map(([columnName, tasks]) => {
          const filteredTasks = selectedUser === "All" ? tasks : tasks.filter((t) => t.assignedTo === selectedUser);
          const isBlenderCol = columnName.includes("BLENDER");
          const isRevitCol = columnName.includes("REVIT");
          
          let headerColor = "text-zinc-400";
          if (isBlenderCol) headerColor = "text-emerald-400";
          if (isRevitCol) headerColor = "text-sky-400";

          return (
            <div key={columnName} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(columnName)} className="bg-zinc-850/40 border border-zinc-800/80 rounded-xl p-4 w-full min-h-[760px] flex flex-col transition-all h-full">
              <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-zinc-800/60">
                <h2 className={`font-black text-[13px] uppercase tracking-wider ${headerColor}`}>{columnName.replace("_", " ")}</h2>
                <span className="bg-zinc-800 text-zinc-200 text-xs px-2.5 py-0.5 rounded border border-zinc-700 font-black">{filteredTasks.length}</span>
              </div>

              <div className="space-y-4 flex-1 overflow-y-auto max-h-[75vh] pr-0.5 custom-scrollbar">
                {filteredTasks.map((task) => (
                  <div key={task.id} draggable onDragStart={() => handleDragStart(task, columnName)} onClick={() => setSelectedTask(task)} className="bg-zinc-800 hover:bg-zinc-750/90 rounded-xl p-4.5 cursor-grab active:cursor-grabbing border border-zinc-700/70 shadow-md transition-all group">
                    <div className="flex gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
                      <span className={`px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider rounded ${isBlenderCol ? "bg-emerald-950 text-emerald-400 border border-emerald-900/50" : isRevitCol ? "bg-sky-950 text-sky-400 border border-sky-900/50" : "bg-zinc-900 text-zinc-400 border border-zinc-800"}`}>{isBlenderCol ? "Blender" : isRevitCol ? "Revit" : "General"}</span>
                    </div>
                    
                    <h3 className="font-black text-base text-zinc-100 mb-4 leading-snug group-hover:text-white transition-colors">{task.title}</h3>
                    
                    <div className="space-y-3.5 text-sm font-bold text-zinc-300 border-t border-zinc-700/60 pt-3.5" onClick={(e) => e.stopPropagation()}>
                    {(columnName === "DONE_BLENDER" || columnName === "DONE_REVIT") && (
  <button
    onClick={(e) => {
      e.stopPropagation();
      archiveTaskLocally(task.id);
    }}
    className="mt-3 w-full bg-zinc-800 hover:bg-orange-700 text-zinc-400 hover:text-white text-xs font-bold py-1.5 rounded border border-zinc-700 transition"
  >
    ↙ Move to Archive
  </button>
)}
                      <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold">Level:</span><span className="bg-zinc-900 text-zinc-100 px-2 py-0.5 rounded text-[12px] font-black font-mono border border-zinc-750">{task.level || "—"}</span></div>
                      
                      {/* FITUR BARU: Dropdown Modeler Langsung Di Board Utama untuk Re-assign & Unassign */}
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-zinc-500 font-bold">Modeler:</span>
                        <select 
                          value={task.assignedTo || "—"} 
                          onChange={(e) => updateTaskModeler(task, columnName, e.target.value)}
                          className="bg-zinc-900 border border-zinc-700 text-sky-400 text-[13px] font-black rounded px-2 py-1 max-w-[140px] focus:outline-none focus:border-sky-500"
                        >
                          <option value="—" className="text-amber-500 font-bold">⚠️ Unassigned</option>
                          {masterModelers.map((name) => (
                            <option key={name} value={name} className="text-zinc-200">{name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex justify-between items-center"><span className="text-zinc-500 font-bold">Due Date:</span><span className={`font-black font-mono text-[13px] ${task.dueDate !== "—" ? "text-emerald-400" : "text-zinc-600"}`}>{task.dueDate}</span></div>
                    </div>
                  </div>
                ))}
                {filteredTasks.length === 0 && <div className="text-center py-10 text-sm text-zinc-600 border border-dashed border-zinc-800 rounded-xl font-black">Kosong</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* ==================== SCREEN OVERLAY 1: POOL UNASSIGNED (FULL LAYAR) ==================== */}
      {showUnassignedFull && (
        <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col p-8 overflow-hidden animate-fade-in">
          {/* Header Full Screen */}
          <div className="flex justify-between items-start pb-6 border-b border-zinc-800 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-amber-400">📋 Master Pool Unassigned Tasks</h2>
                <span className="bg-amber-500 text-zinc-950 text-sm font-black px-3 py-0.5 rounded-full">{unassignedTasks.length} Aset</span>
              </div>
              <p className="text-zinc-400 mt-1.5 text-sm">Gunakan kolom dropdown pada tiap kartu untuk mendistribusikan aset ke papan kerja modeler.</p>
            </div>
            <button onClick={() => setShowUnassignedFull(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black text-sm px-5 py-2.5 rounded-xl border border-zinc-700 transition-all">
              ✕ Tutup Dashboard [ESC]
            </button>
          </div>

          {/* Cari Cepat Data Banyak */}
          <div className="mb-6">
            <input 
              type="text" 
              placeholder="Ketik nama gedung, lokasi, atau ID aset untuk memfilter..." 
              value={searchUnassigned} 
              onChange={(e) => setSearchUnassigned(e.target.value)} 
              className="w-full max-w-xl bg-zinc-900 border border-zinc-750 rounded-xl px-5 py-3.5 text-base text-zinc-200 focus:outline-none focus:border-amber-500 font-bold shadow-inner"
            />
          </div>

          {/* Grid View Data Ratusan (Layout Lega) */}
          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12 pr-2 custom-scrollbar">
            {filteredUnassigned.map((task) => (
              <div key={task.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-5 shadow-lg hover:border-zinc-700/80 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <span className="text-xs font-mono text-zinc-500 font-bold">ASET ID: {task.bdgId}</span>
                    <span className="bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-md text-xs font-black border border-zinc-700">Lvl: {task.level}</span>
                  </div>
                  <h4 className="font-black text-base text-zinc-100 leading-snug">{task.title}</h4>
                </div>

                {/* DROPDOWN SELECT MODELER */}
                <div className="border-t border-zinc-800/80 pt-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-zinc-400">Tugaskan ke:</span>
                  <select
                    value="—"
                    onChange={(e) => updateTaskModeler(task, null, e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs font-black rounded-lg px-3 py-2 flex-1 focus:outline-none focus:border-amber-500"
                  >
                    <option value="—">— Pilih Modeler —</option>
                    {masterModelers.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            {filteredUnassigned.length === 0 && (
              <div className="col-span-full text-center py-24 text-zinc-600 font-black text-lg">Tidak ada sisa antrean unassigned yang ditemukan.</div>
            )}
          </div>
        </div>
      )}

      {/* ==================== SCREEN OVERLAY 2: ARSIP DONE (FULL LAYAR) ==================== */}
      {showArchiveFull && (
        <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col p-8 overflow-hidden animate-fade-in">
          <div className="flex justify-between items-start pb-6 border-b border-zinc-800 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-3xl font-black text-zinc-300">📦 Gudang Arsip Pekerjaan Selesai</h2>
                <span className="bg-zinc-800 text-zinc-300 text-sm font-black px-3 py-0.5 rounded-full border border-zinc-700">{archivedTasks.length} Berkas</span>
              </div>
              <p className="text-zinc-400 mt-1.5 text-sm">Kumpulan seluruh riwayat bangunan yang telah selesai diverifikasi oleh tim produksi.</p>
            </div>
            <button onClick={() => setShowArchiveFull(false)} className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-black text-sm px-5 py-2.5 rounded-xl border border-zinc-700 transition-all">
              ✕ Tutup Dashboard [ESC]
            </button>
          </div>

          <div className="mb-6">
            <input 
              type="text" 
              placeholder="Cari arsip berdasarkan nama gedung, id, atau nama modeler..." 
              value={searchArchive} 
              onChange={(e) => setSearchArchive(e.target.value)} 
              className="w-full max-w-xl bg-zinc-900 border border-zinc-750 rounded-xl px-5 py-3.5 text-base text-zinc-200 focus:outline-none focus:border-zinc-500 font-bold shadow-inner"
            />
          </div>

          <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-12 pr-2 custom-scrollbar">
            {filteredArchive.map((task) => (
              <div key={task.id} className="bg-zinc-900/50 border border-zinc-850 p-4.5 rounded-2xl opacity-80 hover:opacity-100 transition-all">
                <div className="flex justify-between text-xs font-mono font-bold mb-2">
                  <span className="text-zinc-600">ID: {task.bdgId}</span>
                  <span className={task.status.toUpperCase().includes("BLENDER") ? "text-emerald-500" : "text-sky-500 font-black"}>{task.status}</span>
                </div>
                <h4 className="font-extrabold text-sm text-zinc-200 line-clamp-2 mb-3">{task.title}</h4>
                <div className="text-xs text-zinc-400 border-t border-zinc-850 pt-3 flex justify-between">
                  <span>Modeler: <strong className="text-zinc-300 font-black">{task.assignedTo}</strong></span>
                  <span>Lvl: <strong className="text-zinc-300 font-mono">{task.level}</strong></span>
                  <button
  onClick={() => unarchiveTaskLocally(task.id)}
  className="mt-3 w-full bg-zinc-800 hover:bg-yellow-700 text-zinc-400 hover:text-white text-xs font-bold py-1.5 rounded border border-zinc-700 transition"
>
  ↩ Restore from Archive
</button>
                </div>
              </div>
            ))}
            
            {filteredArchive.length === 0 && (
              <div className="col-span-full text-center py-24 text-zinc-700 font-black text-lg">Gudang arsip kosong.</div>
            )}
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskModal task={selectedTask} onClose={() => { setSelectedTask(null); fetchSpreadsheetData(); }} />
      )}
    </main>
  );
}