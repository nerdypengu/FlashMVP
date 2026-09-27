import { useState } from 'react'
import './DatabaseSchema.css'

const TABLES = [
  { name: 'users', x: 24, y: 24, fields: [
    { name: 'id', type: 'UUID', key: 'PK', constraint: 'PRIMARY KEY', sample: '00000000-0000-4000-8000-000000000001' },
    { name: 'email', type: 'VARCHAR(255)', key: '', constraint: 'UNIQUE · NOT NULL', sample: 'buyer@example.com' },
    { name: 'name', type: 'VARCHAR(255)', key: '', constraint: 'NOT NULL', sample: 'Alex' },
    { name: 'created_at', type: 'TIMESTAMPTZ', key: '', constraint: 'DEFAULT NOW()', sample: '2026-09-26T00:15:00Z' },
  ] },
  { name: 'orders', x: 384, y: 24, fields: [
    { name: 'id', type: 'UUID', key: 'PK', constraint: 'PRIMARY KEY', sample: '00000000-0000-4000-8000-000000000002' },
    { name: 'user_id', type: 'UUID', key: 'FK', constraint: 'NOT NULL → users.id', sample: '00000000-0000-4000-8000-000000000001' },
    { name: 'status', type: 'VARCHAR(32)', key: '', constraint: "DEFAULT 'pending'", sample: 'pending' },
    { name: 'created_at', type: 'TIMESTAMPTZ', key: '', constraint: 'DEFAULT NOW()', sample: '2026-09-26T00:15:00Z' },
  ] },
  { name: 'order_items', x: 744, y: 24, fields: [
    { name: 'id', type: 'UUID', key: 'PK', constraint: 'PRIMARY KEY', sample: '00000000-0000-4000-8000-000000000003' },
    { name: 'order_id', type: 'UUID', key: 'FK', constraint: 'NOT NULL → orders.id', sample: '00000000-0000-4000-8000-000000000002' },
    { name: 'product_id', type: 'UUID', key: 'FK', constraint: 'NOT NULL → products.id', sample: '00000000-0000-4000-8000-000000000004' },
    { name: 'quantity', type: 'INTEGER', key: '', constraint: 'NOT NULL · CHECK (quantity > 0)', sample: '2' },
  ] },
  { name: 'products', x: 744, y: 324, fields: [
    { name: 'id', type: 'UUID', key: 'PK', constraint: 'PRIMARY KEY', sample: '00000000-0000-4000-8000-000000000004' },
    { name: 'name', type: 'VARCHAR(255)', key: '', constraint: 'NOT NULL', sample: 'Quantum Mechanical Keyboard' },
    { name: 'price_cents', type: 'INTEGER', key: '', constraint: 'NOT NULL · CHECK (price_cents >= 0)', sample: '18900' },
    { name: 'created_at', type: 'TIMESTAMPTZ', key: '', constraint: 'DEFAULT NOW()', sample: '2026-09-26T00:15:00Z' },
  ] },
]

const RELATIONS = [
  { from: 'users', to: 'orders', field: 'user_id', path: 'M244 78 H330 V106 H384', start: [260, 70], end: [364, 98] },
  { from: 'orders', to: 'order_items', field: 'order_id', path: 'M604 78 H690 V106 H744', start: [620, 70], end: [724, 98] },
  { from: 'products', to: 'order_items', field: 'product_id', path: 'M964 378 H1048 V134 H964', start: [978, 398], end: [978, 126] },
]

export default function DatabaseSchema() {
  const [selected, setSelected] = useState('products')
  const [zoom, setZoom] = useState(100)
  const table = TABLES.find(item => item.name === selected)!
  const relationships = RELATIONS.filter(item => item.from === selected || item.to === selected)

  return (
    <section className="db-schema" aria-label="Database schema explorer">
      <div className="db-schema-heading">
        <div>
          <h4>Database relationships</h4>
          <p>FlashStore sandbox · Sample schema · Select a table to inspect its columns.</p>
        </div>
        <div className="db-schema-legend"><span>PK Primary key</span><span>FK Foreign key</span><span>1:N One to many</span></div>
      </div>
      <div className="db-schema-diagram">
      <div className="db-schema-toolbar" role="group" aria-label="Diagram zoom controls">
        <button type="button" onClick={() => setZoom(value => Math.max(50, value - 25))} disabled={zoom === 50} aria-label="Zoom out">−</button>
        <output aria-live="polite" aria-label="Zoom level">{zoom}%</output>
        <button type="button" onClick={() => setZoom(value => Math.min(200, value + 25))} disabled={zoom === 200} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => setZoom(100)} disabled={zoom === 100}>Reset</button>
      </div>
      <div className="db-schema-viewport" tabIndex={0} aria-label="Scrollable relationship diagram">
        <div className="db-schema-scaled" style={{ width: 1080 * zoom / 100, height: 560 * zoom / 100 }}>
        <div className="db-schema-canvas" style={{ transform: `scale(${zoom / 100})` }}>
          <svg className="db-schema-lines" viewBox="0 0 1080 560" role="img" aria-label="Users have many orders. Orders have many order items. Products have many order items.">
            {RELATIONS.map(relation => (
              <g key={relation.field} className={relation.from === selected || relation.to === selected ? 'is-active' : ''}>
                <title>{relation.to}.{relation.field} references {relation.from}.id (many to one)</title>
                <path d={relation.path} />
                <text x={relation.start[0]} y={relation.start[1]}>1</text>
                <text x={relation.end[0]} y={relation.end[1]}>N</text>
              </g>
            ))}
          </svg>
          {TABLES.map(item => (
            <button key={item.name} type="button" className={`db-schema-table${selected === item.name ? ' is-selected' : ''}`}
              style={{ left: item.x, top: item.y }} onClick={() => setSelected(item.name)} aria-pressed={selected === item.name}>
              <span className="db-schema-table-heading"><strong>{item.name}</strong><span>{item.fields.length} columns</span></span>
              {item.fields.map(field => (
                <span key={field.name} className="db-schema-field">
                  <span className={`db-schema-key ${field.key.toLowerCase()}`}>{field.key || '·'}</span>
                  <span>{field.name}</span><span className="db-schema-type">{field.type}</span>
                </span>
              ))}
            </button>
          ))}
        </div>
        </div>
      </div>
      </div>
      <div className="db-schema-details">
        <h4><code>{table.name}</code><span>{table.fields.length} columns · {relationships.length} relationships</span></h4>
        <div className="db-schema-detail-scroll">
          <table>
            <thead><tr><th>Column</th><th>Type</th><th>Constraints</th><th>Sample value</th></tr></thead>
            <tbody>{table.fields.map(field => (
              <tr key={field.name}><td><code>{field.name}</code></td><td>{field.type}</td><td>{field.constraint}</td><td><code>{field.sample}</code></td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="db-schema-relations" aria-live="polite">
          {relationships.map(relation => <p key={relation.field}><code>{relation.from}.id</code><span>1 → N</span><code>{relation.to}.{relation.field}</code></p>)}
        </div>
      </div>
    </section>
  )
}
