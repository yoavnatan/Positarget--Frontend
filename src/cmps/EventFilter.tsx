import { FilterBy } from '../types/event'
import { useForm } from '../customHooks/useForm'
import { useEffectUpdate } from '../customHooks/useEffectUpdate'
import { useAppSelector } from '../store/store'
import { useEffect, useRef, useState } from 'react'

export function EventFilter({ filterBy, setFilterBy }: { filterBy: FilterBy, setFilterBy: (filterBy: FilterBy) => void }) {

    const [filterToEdit, handleChange, setFilterToEdit] = useForm(structuredClone(filterBy))
    const { events } = useAppSelector(state => state.eventModule)
    const [labels, setLabels] = useState<string[]>([])
    const [isScrolledLeft, setIsScrolledLeft] = useState(false)
    const [isScrolledRight, setIsScrolledRight] = useState(true)
    const carouselRef = useRef<HTMLUListElement>(null)

    useEffectUpdate(() => {
        setFilterBy(filterToEdit)
    }, [filterToEdit])

    useEffectUpdate(() => {
        const usedLabels = new Set<string>();
        const finalLabels: string[] = [];

        events.forEach(ev => {
            const uniqueLabelForEvent = ev.labels.find(label => {
                const normalized = label.trim().toLowerCase();
                return !usedLabels.has(normalized);
            });

            if (uniqueLabelForEvent) {
                finalLabels.push(uniqueLabelForEvent);
                usedLabels.add(uniqueLabelForEvent.trim().toLowerCase());
            }
        });

        setLabels(finalLabels);
    }, [events]);

    function clearFilter() {
        setFilterToEdit(prev => ({ ...prev, txt: '' }))
    }

    function clearSort() {
        setFilterToEdit(prev => ({ ...prev, sortField: '', sortDir: 1 }))
    }

    function handleFilterByLabel(label: string) {
        setFilterToEdit(prev => {
            const labels = label === '' ? [] : [label]
            // prev.labels.includes(label) ? prev.labels.filter(l => l !== label) : [...prev.labels, label]
            return { ...prev, labels }
        })
    }


    useEffect(() => {
        const handleScroll = () => {
            if (!carouselRef.current) return
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
            setIsScrolledLeft(scrollLeft > 2)
            const hasMoreToScroll = Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2
            setIsScrolledRight(hasMoreToScroll)
        }

        const carousel = carouselRef.current
        if (carousel) {
            carousel.addEventListener('scroll', handleScroll)
            handleScroll()
            const timeoutId = setTimeout(handleScroll, 100)

            return () => {
                carousel.removeEventListener('scroll', handleScroll)
                clearTimeout(timeoutId)
            }
        }
    }, [])


    return (
        <section className="event-filter">
            {/* <h3>Filter:</h3>
            <input
                type="text"
                name="txt"
                value={filterToEdit.txt}
                placeholder="Free text"
                onChange={handleChange}
            />
            <button className="btn-clear" onClick={clearFilter}>Clear</button> */}

            {/* <h3>Sort:</h3>
            <div className="sort-field">
                <label>
                    <span>Speed</span>
                    <input
                        type="radio"
                        name="sortField"
                        value="speed"
                        checked={filterToEdit.sortField === 'speed'}
                        onChange={handleChange}
                    />
                </label>
                <label>
                    <span>Title</span>
                    <input
                        type="radio"
                        name="sortField"
                        value="title"
                        checked={filterToEdit.sortField === 'title'}
                        onChange={handleChange}
                    />
                </label>
            </div>

            <div className="sort-dir">
                <label>
                    <span>Asce</span>
                    <input
                        type="radio"
                        name="sortDir"
                        value="1"
                        checked={+filterToEdit.sortDir === 1}
                        onChange={handleChange}
                    />
                </label>
                <label>
                    <span>Desc</span>
                    <input
                        type="radio"
                        name="sortDir"
                        value="-1"
                        checked={+filterToEdit.sortDir === -1}
                        onChange={handleChange}
                    />
                </label>
            </div> */}
            {/* <button className="btn-clear" onClick={clearSort}>Clear</button> */}

            <h3>All Markets</h3>
            <div >
                <ul className={`filter-carusel ${isScrolledLeft ? 'scrolled-left' : ''} ${isScrolledRight ? 'scrolled-right' : ''}`} ref={carouselRef}>
                    <li onClick={() => handleFilterByLabel('')} className={filterToEdit.labels.length > 0 ? '' : 'active'}>All</li>
                    {labels.map(label => (
                        <li key={label} onClick={() => handleFilterByLabel(label)} className={filterToEdit.labels.includes(label) ? 'active' : ''}>
                            {label}
                        </li>
                    ))}

                </ul>

            </div>
        </section>
    )
}