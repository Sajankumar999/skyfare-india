import React, { useState } from 'react';
import {
  Database,
  Copy,
  Check,
  Download,
  Table,
  Code,
  Key,
  Layers,
  FileText,
  Search
} from 'lucide-react';
import { DB_TABLES_METADATA, RAW_SQL_SCHEMA, DbTableMeta } from '../db/database';

export const SchemaViewer: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'tables' | 'raw_sql' | 'erd'>('tables');
  const [selectedTable, setSelectedTable] = useState<DbTableMeta>(DB_TABLES_METADATA[5]); // fare_observations default
  const [copied, setCopied] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const handleCopySql = () => {
    navigator.clipboard.writeText(RAW_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([RAW_SQL_SCHEMA], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skyfare_india_schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredTables = DB_TABLES_METADATA.filter(
    (t) =>
      t.tableName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              PostgreSQL / SQLite Production DDL
            </span>
            <span className="text-xs text-slate-500">
              10 Core Tables • National Airfare Statistics Specification
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <Database className="w-6 h-6 text-emerald-600" />
            Database Architecture & Schema Inspector
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Relational schema stored in <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600">/schema.sql</code> and <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600">/src/db/database.ts</code>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors border border-slate-200 dark:border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied SQL!' : 'Copy schema.sql'}</span>
          </button>

          <button
            onClick={handleDownloadSql}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .SQL</span>
          </button>
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveSubTab('tables')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'tables'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Interactive Table Browser (10 Tables)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('raw_sql')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'raw_sql'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Code className="w-3.5 h-3.5" />
          <span>Full DDL Code (/schema.sql)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('erd')}
          className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeSubTab === 'erd'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Architecture & Formula Model</span>
        </button>
      </div>

      {/* TAB 1: INTERACTIVE TABLE BROWSER */}
      {activeSubTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table List Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search tables or columns..."
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="space-y-1.5">
              {filteredTables.map((t) => {
                const isSelected = selectedTable.tableName === t.tableName;
                return (
                  <button
                    key={t.tableName}
                    onClick={() => setSelectedTable(t)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-800 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                        {t.tableName}
                      </span>
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {t.columns.length} cols
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {t.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Table Details (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-mono text-lg font-black text-slate-900 dark:text-white">
                    {selectedTable.tableName}
                  </h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    {selectedTable.category}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {selectedTable.description}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-bold">Estimated Scale</span>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {selectedTable.recordCount.toLocaleString('en-IN')} rows
                </span>
              </div>
            </div>

            {/* Column Schema Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-2">Field Name</th>
                    <th className="pb-2">SQL Data Type</th>
                    <th className="pb-2">Key / Constraint</th>
                    <th className="pb-2">Description & MoSPI Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono">
                  {selectedTable.columns.map((col) => (
                    <tr key={col.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">
                        {col.name}
                      </td>
                      <td className="py-2.5 text-blue-600 dark:text-blue-400">
                        {col.type}
                      </td>
                      <td className="py-2.5 font-sans">
                        {col.isPrimary && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                            <Key className="w-2.5 h-2.5" /> PK
                          </span>
                        )}
                        {col.isForeign && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-900 dark:bg-indigo-950 dark:text-indigo-300 ml-1">
                            FK
                          </span>
                        )}
                        {col.nullable === false && !col.isPrimary && (
                          <span className="text-[10px] text-slate-400 ml-1 font-semibold">NOT NULL</span>
                        )}
                      </td>
                      <td className="py-2.5 font-sans text-slate-600 dark:text-slate-400">
                        {col.description}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FULL RAW SQL */}
      {activeSubTab === 'raw_sql' && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-6 font-mono text-xs overflow-x-auto border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-slate-200">schema.sql (PostgreSQL / SQLite Compatible)</span>
            </div>
            <span className="text-slate-400 text-[11px]">UTF-8 • Standard SQL DDL</span>
          </div>
          <pre className="text-emerald-400 leading-relaxed max-h-[600px] overflow-y-auto">
            {RAW_SQL_SCHEMA}
          </pre>
        </div>
      )}

      {/* TAB 3: ERD & FORMULA ARCHITECTURE */}
      {activeSubTab === 'erd' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Data Flow & Index Calculation Pipeline
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              How high-frequency fare observations flow into the MoSPI Consumer Price Index (CPI) basket.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Step 1 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="font-mono font-bold text-blue-600">STEP 01</div>
              <h4 className="font-bold text-slate-900 dark:text-white">High-Frequency Ingestion</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Automated runners poll registered <strong>data_sources</strong> every 30 minutes, recording unbundled fares in <strong>fare_observations</strong> with SHA-256 batch seals.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="font-mono font-bold text-indigo-600">STEP 02</div>
              <h4 className="font-bold text-slate-900 dark:text-white">Horizon Stratification</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Quotes are segregated across 5 distinct advance booking lead times (<strong>T+1, T+7, T+15, T+30, T+45</strong>) to prevent booking-lead bias.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="font-mono font-bold text-amber-600">STEP 03</div>
              <h4 className="font-bold text-slate-900 dark:text-white">Laspeyres & Fisher Ideal</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Weighted by DGCA passenger volume <strong>route_weights</strong>. SkyFare computes both Laspeyres and Fisher Superlative index to eliminate substitution bias.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
              <div className="font-mono font-bold text-emerald-600">STEP 04</div>
              <h4 className="font-bold text-slate-900 dark:text-white">CPI Transmission</h4>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Aggregated daily indices write directly to <strong>daily_indices</strong> and compute real-time basis point transmission into Headline and Transport CPI.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
