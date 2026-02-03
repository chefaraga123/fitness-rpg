import { useState, useCallback } from 'react';
import type { LifestyleCSVMapping, DailyLog } from '../../types';
import type { ParsedCSV } from '../../utils/csvParser';
import { parseCSV, mapCSVToLifestyleLogs } from '../../utils/csvParser';
import styles from './LifestyleImport.module.css';

interface Props {
  existingLogs: DailyLog[];
  onImport: (logs: DailyLog[]) => void;
}

type Step = 'upload' | 'mapping' | 'preview';

export function LifestyleImport({ existingLogs, onImport }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [parsedData, setParsedData] = useState<ParsedCSV | null>(null);
  const [mapping, setMapping] = useState<LifestyleCSVMapping>({
    date: '',
    sleepDuration: '',
    sleepScore: '',
    wakeTime: '',
    meal1: '',
    meal2: '',
    meal3: '',
    snacks: '',
    supplements: [],
  });
  const [previewLogs, setPreviewLogs] = useState<DailyLog[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file');
      return;
    }

    try {
      const parsed = await parseCSV(file);
      setParsedData(parsed);

      // Auto-detect columns
      const autoMapping: LifestyleCSVMapping = {
        date: '',
        supplements: [],
      };

      const supplementKeywords = ['vitamin', 'omega', 'lion', 'creatine', 'magnesium', 'probiotic', 'pomegranate'];

      for (const h of parsed.headers) {
        const lower = h.toLowerCase();
        if (lower === 'date') {
          autoMapping.date = h;
        } else if (lower.includes('sleep duration') && !lower.includes('average')) {
          autoMapping.sleepDuration = h;
        } else if (lower.includes('overall_score') || lower.includes('sleep score')) {
          autoMapping.sleepScore = h;
        } else if (lower.includes('wakeup time') || lower.includes('wake time')) {
          autoMapping.wakeTime = h;
        } else if (lower === 'meal 1' || lower === 'breakfast') {
          autoMapping.meal1 = h;
        } else if (lower === 'meal 2' || lower === 'lunch') {
          autoMapping.meal2 = h;
        } else if (lower === 'meal 3' || lower === 'dinner') {
          autoMapping.meal3 = h;
        } else if (lower === 'snacks') {
          autoMapping.snacks = h;
        } else if (supplementKeywords.some((kw) => lower.includes(kw))) {
          autoMapping.supplements.push(h);
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
    if (!parsedData || !mapping.date) {
      alert('Please map at least the date field');
      return;
    }

    const logs = mapCSVToLifestyleLogs(parsedData.rows, mapping, existingLogs);
    setPreviewLogs(logs);
    setStep('preview');
  }, [parsedData, mapping, existingLogs]);

  const handleImport = useCallback(() => {
    onImport(previewLogs);
    setParsedData(null);
    setPreviewLogs([]);
    setStep('upload');
  }, [previewLogs, onImport]);

  const handleCancel = useCallback(() => {
    setParsedData(null);
    setPreviewLogs([]);
    setStep('upload');
  }, []);

  const toggleSupplement = (header: string) => {
    setMapping((m) => ({
      ...m,
      supplements: m.supplements.includes(header)
        ? m.supplements.filter((s) => s !== header)
        : [...m.supplements, header],
    }));
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Import Lifestyle Data</h3>

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
            id="lifestyle-upload"
          />
          <label htmlFor="lifestyle-upload" className={styles.dropLabel}>
            <span className={styles.dropIcon}>🌙</span>
            <span>Import sleep, meals & supplements</span>
          </label>
        </div>
      )}

      {step === 'mapping' && parsedData && (
        <div className={styles.mappingSection}>
          <p className={styles.mappingInfo}>
            Found {parsedData.rows.length} rows. Map your columns:
          </p>

          <div className={styles.mappingGroup}>
            <h4>Required</h4>
            <MappingSelect
              label="Date *"
              value={mapping.date}
              options={parsedData.headers}
              onChange={(v) => setMapping((m) => ({ ...m, date: v }))}
            />
          </div>

          <div className={styles.mappingGroup}>
            <h4>Sleep</h4>
            <div className={styles.mappingGrid}>
              <MappingSelect
                label="Sleep Duration"
                value={mapping.sleepDuration || ''}
                options={parsedData.headers}
                onChange={(v) => setMapping((m) => ({ ...m, sleepDuration: v || undefined }))}
                optional
              />
              <MappingSelect
                label="Sleep Score"
                value={mapping.sleepScore || ''}
                options={parsedData.headers}
                onChange={(v) => setMapping((m) => ({ ...m, sleepScore: v || undefined }))}
                optional
              />
              <MappingSelect
                label="Wake Time"
                value={mapping.wakeTime || ''}
                options={parsedData.headers}
                onChange={(v) => setMapping((m) => ({ ...m, wakeTime: v || undefined }))}
                optional
              />
            </div>
          </div>

          <div className={styles.mappingGroup}>
            <h4>Meals</h4>
            <div className={styles.mappingGrid}>
              <MappingSelect
                label="Meal 1"
                value={mapping.meal1 || ''}
                options={parsedData.headers}
                onChange={(v) => setMapping((m) => ({ ...m, meal1: v || undefined }))}
                optional
              />
              <MappingSelect
                label="Meal 2"
                value={mapping.meal2 || ''}
                options={parsedData.headers}
                onChange={(v) => setMapping((m) => ({ ...m, meal2: v || undefined }))}
                optional
              />
              <MappingSelect
                label="Meal 3"
                value={mapping.meal3 || ''}
                options={parsedData.headers}
                onChange={(v) => setMapping((m) => ({ ...m, meal3: v || undefined }))}
                optional
              />
              <MappingSelect
                label="Snacks"
                value={mapping.snacks || ''}
                options={parsedData.headers}
                onChange={(v) => setMapping((m) => ({ ...m, snacks: v || undefined }))}
                optional
              />
            </div>
          </div>

          <div className={styles.mappingGroup}>
            <h4>Supplements (click to select)</h4>
            <div className={styles.supplementGrid}>
              {parsedData.headers
                .filter((h) => h.toLowerCase() !== 'date')
                .map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={`${styles.supplementTag} ${
                      mapping.supplements.includes(h) ? styles.selected : ''
                    }`}
                    onClick={() => toggleSupplement(h)}
                  >
                    {h}
                  </button>
                ))}
            </div>
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
          {previewLogs.length === 0 ? (
            <p className={styles.noData}>No new days to import</p>
          ) : (
            <>
              <p className={styles.previewInfo}>
                Ready to import {previewLogs.length} days:
              </p>
              <div className={styles.previewList}>
                {previewLogs.slice(0, 5).map((l) => (
                  <div key={l.date} className={styles.previewItem}>
                    <span className={styles.previewDate}>{l.date}</span>
                    {l.sleepDuration && (
                      <span className={styles.previewSleep}>
                        {Math.floor(l.sleepDuration / 60)}h {l.sleepDuration % 60}m
                      </span>
                    )}
                    {l.sleepScore && (
                      <span className={styles.previewScore}>{l.sleepScore}</span>
                    )}
                    <span className={styles.previewMeals}>{l.mealsLogged} meals</span>
                    <span className={styles.previewSupps}>
                      {l.supplementsTaken}/{l.supplementsTotal} supps
                    </span>
                  </div>
                ))}
                {previewLogs.length > 5 && (
                  <p className={styles.moreItems}>...and {previewLogs.length - 5} more</p>
                )}
              </div>
            </>
          )}

          <div className={styles.buttons}>
            <button onClick={handleCancel} className={styles.btnSecondary}>
              Cancel
            </button>
            {previewLogs.length > 0 && (
              <button onClick={handleImport} className={styles.btnPrimary}>
                Import {previewLogs.length} Days
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
  optional = false,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  optional?: boolean;
}) {
  return (
    <div className={styles.mappingField}>
      <label className={styles.mappingLabel}>{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.mappingSelect}
      >
        <option value="">{optional ? '-- None --' : '-- Select --'}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
