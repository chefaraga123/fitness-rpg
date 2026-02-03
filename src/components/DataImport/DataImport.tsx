import { useState, useCallback } from 'react';
import type { WorkoutCSVMapping, WorkoutSet } from '../../types';
import type { ParsedCSV } from '../../utils/csvParser';
import { parseCSV, mapCSVToSets } from '../../utils/csvParser';
import styles from './DataImport.module.css';

interface Props {
  existingSets: WorkoutSet[];
  onImport: (sets: WorkoutSet[]) => void;
}

type Step = 'upload' | 'mapping' | 'preview';

export function DataImport({ existingSets, onImport }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [mapping, setMapping] = useState<WorkoutCSVMapping>({
    date: '',
    exercise: '',
    weight: '',
    reps: '',
  });
  const [previewSets, setPreviewSets] = useState<WorkoutSet[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    try {
      const parsed = await parseCSV(file);
      setParsedData(parsed);

      // Auto-detect common column names
      const autoMapping: WorkoutCSVMapping = { date: '', exercise: '', weight: '', reps: '' };

      for (const h of parsed.headers) {
        const lower = h.toLowerCase();
        if (lower.includes('date')) {
          autoMapping.date = h;
        } else if (lower.includes('exercise') || lower.includes('movement') || lower.includes('lift')) {
          autoMapping.exercise = h;
        } else if (lower.includes('weight') || lower.includes('load') || lower.includes('kg') || lower.includes('lbs')) {
          autoMapping.weight = h;
        } else if (lower.includes('rep')) {
          autoMapping.reps = h;
        }
      }

      setMapping(autoMapping);
      setStep('mapping');
    } catch {
      alert('Failed to parse CSV file');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleMappingSubmit = useCallback(() => {
    if (!parsedData || !mapping.date || !mapping.exercise || !mapping.weight || !mapping.reps) {
      alert('Please map all required fields');
      return;
    }

    const sets = mapCSVToSets(parsedData.rows, mapping, existingSets);
    setPreviewSets(sets);
    setStep('preview');
  }, [parsedData, mapping, existingSets]);

  const handleImport = useCallback(() => {
    onImport(previewSets);
    setParsedData(null);
    setPreviewSets([]);
    setStep('upload');
  }, [previewSets, onImport]);

  const handleCancel = useCallback(() => {
    setParsedData(null);
    setPreviewSets([]);
    setStep('upload');
  }, []);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Import Workout Data</h3>

      {step === 'upload' && (
        <div
          className={`${styles.dropzone} ${dragActive ? styles.active : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            className={styles.fileInput}
            id="csv-upload"
          />
          <label htmlFor="csv-upload" className={styles.dropLabel}>
            <span className={styles.dropIcon}>📁</span>
            <span>Drop CSV file here or click to browse</span>
          </label>
        </div>
      )}

      {step === 'mapping' && parsedData && (
        <div className={styles.mappingSection}>
          <p className={styles.mappingInfo}>
            Found {parsedData.rows.length} rows. Map your columns:
          </p>

          <div className={styles.mappingGrid}>
            <MappingSelect
              label="Date *"
              value={mapping.date}
              options={parsedData.headers}
              onChange={(v) => setMapping((m) => ({ ...m, date: v }))}
            />
            <MappingSelect
              label="Exercise *"
              value={mapping.exercise}
              options={parsedData.headers}
              onChange={(v) => setMapping((m) => ({ ...m, exercise: v }))}
            />
            <MappingSelect
              label="Weight *"
              value={mapping.weight}
              options={parsedData.headers}
              onChange={(v) => setMapping((m) => ({ ...m, weight: v }))}
            />
            <MappingSelect
              label="Reps *"
              value={mapping.reps}
              options={parsedData.headers}
              onChange={(v) => setMapping((m) => ({ ...m, reps: v }))}
            />
          </div>

          <div className={styles.buttons}>
            <button onClick={handleCancel} className={styles.btnSecondary}>
              Cancel
            </button>
            <button onClick={handleMappingSubmit} className={styles.btnPrimary}>
              Preview Import
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className={styles.previewSection}>
          {previewSets.length === 0 ? (
            <p className={styles.noData}>
              No new sets to import (all may be duplicates)
            </p>
          ) : (
            <>
              <p className={styles.previewInfo}>
                Ready to import {previewSets.length} sets:
              </p>
              <div className={styles.previewList}>
                {previewSets.slice(0, 6).map((s) => (
                  <div key={s.id} className={styles.previewItem}>
                    <span className={styles.previewDate}>{s.date}</span>
                    <span className={styles.previewExercise}>{s.exercise}</span>
                    <span className={styles.previewWeight}>{s.weight}kg</span>
                    <span className={styles.previewReps}>x{s.reps}</span>
                  </div>
                ))}
                {previewSets.length > 6 && (
                  <p className={styles.moreItems}>
                    ...and {previewSets.length - 6} more
                  </p>
                )}
              </div>
            </>
          )}

          <div className={styles.buttons}>
            <button onClick={handleCancel} className={styles.btnSecondary}>
              Cancel
            </button>
            {previewSets.length > 0 && (
              <button onClick={handleImport} className={styles.btnPrimary}>
                Import {previewSets.length} Sets
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MappingSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className={styles.mappingField}>
      <label className={styles.mappingLabel}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.mappingSelect}
      >
        <option value="">-- Select --</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
