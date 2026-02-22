import { useState } from 'react';
import { Search, Filter, ChevronDown, Tag, MapPin, Monitor, Clock } from 'lucide-react';

interface AdvancedCourseFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    categories: string[];
    locations: string[];
}

export interface FilterState {
    search: string;
    selectedCategories: string[];
    selectedModalities: string[];
    selectedLocations: string[];
    priceSort: 'asc' | 'desc' | null;
    hasPromotion: boolean;
}

export default function AdvancedCourseFilters({ onFilterChange, categories, locations }: AdvancedCourseFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        selectedCategories: [],
        selectedModalities: [],
        selectedLocations: [],
        priceSort: null,
        hasPromotion: false
    });

    const updateFilters = (newFilters: Partial<FilterState>) => {
        const updated = { ...filters, ...newFilters };
        setFilters(updated);
        onFilterChange(updated);
    };

    const toggleArrayFilter = (field: 'selectedCategories' | 'selectedModalities' | 'selectedLocations', value: string) => {
        const current = filters[field];
        const updated = current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
        updateFilters({ [field]: updated });
    };

    const resetFilters = () => {
        const reset: FilterState = {
            search: '',
            selectedCategories: [],
            selectedModalities: [],
            selectedLocations: [],
            priceSort: null,
            hasPromotion: false
        };
        setFilters(reset);
        onFilterChange(reset);
    };

    const activeCount =
        filters.selectedCategories.length +
        filters.selectedModalities.length +
        filters.selectedLocations.length +
        (filters.priceSort ? 1 : 0) +
        (filters.hasPromotion ? 1 : 0);

    return (
        <div className="advanced-filters mb-6">
            <div className="flex gap-2 items-center">
                <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o palabras clave..."
                        value={filters.search}
                        onChange={(e) => updateFilters({ search: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 40px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'white',
                            fontSize: '14px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                    />
                </div>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`btn ${activeCount > 0 ? 'btn-secondary' : 'btn-outline'}`}
                    style={{
                        height: '45px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        borderColor: activeCount > 0 ? 'var(--brand)' : 'var(--border)',
                        color: activeCount > 0 ? 'var(--brand)' : 'var(--text-main)'
                    }}
                >
                    <Filter size={18} />
                    Filtros {activeCount > 0 && `(${activeCount})`}
                    <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                {activeCount > 0 && (
                    <button
                        onClick={resetFilters}
                        className="btn btn-ghost"
                        style={{ height: '45px', borderRadius: '12px', color: 'var(--text-muted)' }}
                    >
                        Limpiar
                    </button>
                )}
            </div>

            {isOpen && (
                <div
                    className="card mt-3 animate-slide-down"
                    style={{
                        padding: '24px',
                        borderRadius: '16px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(10px)',
                        zIndex: 10
                    }}
                >
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Categories */}
                        <div>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Tag size={14} /> Categorías
                            </h4>
                            <div className="flex flex-col gap-2">
                                {categories.map(cat => (
                                    <label key={cat} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedCategories.includes(cat)}
                                            onChange={() => toggleArrayFilter('selectedCategories', cat)}
                                        />
                                        {cat}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Modality */}
                        <div>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Monitor size={14} /> Modalidad
                            </h4>
                            <div className="flex flex-col gap-2">
                                {['online', 'presencial', 'hibrido'].map(mod => (
                                    <label key={mod} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', textTransform: 'capitalize' }}>
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedModalities.includes(mod)}
                                            onChange={() => toggleArrayFilter('selectedModalities', mod)}
                                        />
                                        {mod}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={14} /> Sede / Ubicación
                            </h4>
                            <div className="flex flex-col gap-2">
                                {locations.map(loc => (
                                    <label key={loc} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                        <input
                                            type="checkbox"
                                            checked={filters.selectedLocations.includes(loc)}
                                            onChange={() => toggleArrayFilter('selectedLocations', loc)}
                                        />
                                        {loc}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Other Filters */}
                        <div>
                            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={14} /> Otros
                            </h4>
                            <div className="flex flex-col gap-4">
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Ordenar por Precio</div>
                                    <select
                                        value={filters.priceSort || ''}
                                        onChange={(e) => updateFilters({ priceSort: (e.target.value as any) || null })}
                                        style={{ width: '100%', padding: '6px', borderRadius: '6px', fontSize: '12px' }}
                                    >
                                        <option value="">Sin orden</option>
                                        <option value="asc">Menor a Mayor</option>
                                        <option value="desc">Mayor a Menor</option>
                                    </select>
                                </div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                                    <input
                                        type="checkbox"
                                        checked={filters.hasPromotion}
                                        onChange={(e) => updateFilters({ hasPromotion: e.target.checked })}
                                    />
                                    Solo con Promoción %
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
