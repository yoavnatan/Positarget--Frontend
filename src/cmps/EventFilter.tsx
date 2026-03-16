import { FilterBy } from '../types/event'
import { useForm } from '../customHooks/useForm'
import { useEffectUpdate } from '../customHooks/useEffectUpdate'
import { useAppSelector } from '../store/store'
import { useEffect, useRef, useState } from 'react'
import { IoBookmark, IoBookmarkOutline, IoSearchOutline } from "react-icons/io5"
import useClickOutside from '../customHooks/useClickOutside'
import Sort from '../assets/svg/sort.svg?react'
import Sort2 from '../assets/svg/sort2.svg?react'
import * as Select from '@radix-ui/react-select'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import Trending from '../assets/svg/trending.svg?react'
import New from '../assets/svg/new.svg?react'
import Popular from '../assets/svg/fire.svg?react'

// ייבוא Framer Motion
import { motion, AnimatePresence } from 'framer-motion'
import { AnimatedSortIcon } from './AnimatedSortIcon'

export function EventFilter({ filterBy, setFilterBy }: { filterBy: FilterBy, setFilterBy: (filterBy: FilterBy) => void }) {

    const [filterToEdit, handleChange, setFilterToEdit] = useForm({ ...filterBy })
    const { events } = useAppSelector(state => state.eventModule)
    const [labels, setLabels] = useState<string[]>([])
    const [isScrolledLeft, setIsScrolledLeft] = useState(false)
    const [isScrolledRight, setIsScrolledRight] = useState(true)
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [isSortOn, setIsSortOn] = useState(false)

    const carouselRef = useRef<HTMLUListElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLInputElement>(null)

    useClickOutside(searchRef, () => setIsSearchOpen(false), containerRef)

    useEffectUpdate(() => {
        setFilterBy(filterToEdit)
    }, [filterToEdit])


    useEffectUpdate(() => {
        const usedLabels = new Set<string>()
        const finalLabels: string[] = []

        events.forEach(ev => {
            const uniqueLabelForEvent = ev.labels.find(label => {
                const normalized = label.trim().toLowerCase()
                return !usedLabels.has(normalized)
            })

            if (uniqueLabelForEvent) {
                finalLabels.push(uniqueLabelForEvent)
                usedLabels.add(uniqueLabelForEvent.trim().toLowerCase())
            }
        })

        setLabels(finalLabels)
        setFilterToEdit(prev => ({ ...prev, labels: [] }))
    }, [events])

    function clearTxtInput() {
        setFilterToEdit(prev => ({ ...prev, txt: '' }))
    }

    function handleFilterByLabel(label: string) {
        setFilterToEdit(prev => {
            const labels = label === '' ? [] : [label]
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
            return () => carousel.removeEventListener('scroll', handleScroll)
        }
    }, [labels])

    function onToggleShowFavorites() {
        setFilterToEdit(prev => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))
    }

    function onToggleSort() {
        setIsSortOn(prev => !prev)
    }

    return (
        <section className="event-filter">
            <header>
                <h3>All Markets</h3>
                <div className="filter-icons">
                    <div ref={containerRef} className={`search-container ${isSearchOpen ? "open" : ""}`}
                        onClick={(ev) => {
                            ev.stopPropagation()
                            searchRef.current?.focus()
                            setIsSearchOpen(prev => !prev)
                        }}>
                        <div className="icon-wrapper">
                            <IoSearchOutline className={`search-icon`} />
                        </div>
                        <input onClick={(ev) => ev.stopPropagation()} ref={searchRef} type="text" name="txt" placeholder="Search..." autoFocus
                            value={filterToEdit.txt} onChange={handleChange} />
                    </div>

                    <div className={`icon-wrapper ${isSortOn ? "full" : ''}`} onClick={(ev) => {
                        ev.stopPropagation();
                        onToggleSort();
                    }}>
                        <AnimatedSortIcon isSortOn={isSortOn} />
                    </div>

                    <div className="icon-wrapper" onClick={onToggleShowFavorites}>
                        {!filterBy.favoritesOnly ? <IoBookmarkOutline /> : <IoBookmark className="icon full" />}
                    </div>
                </div>
            </header>

            <div>
                <ul className={`filter-carusel ${isScrolledLeft ? 'scrolled-left' : ''} ${isScrolledRight ? 'scrolled-right' : ''}`} ref={carouselRef}>
                    <li onClick={() => handleFilterByLabel('')} className={filterToEdit.labels.length > 0 ? '' : 'active'}>All</li>
                    {labels.map(label => (
                        <li key={label} onClick={() => {
                            handleFilterByLabel(label)
                            clearTxtInput()
                        }} className={filterToEdit.labels.includes(label) ? 'active' : ''}>
                            {label}
                        </li>
                    ))}
                </ul>
            </div>

            {/* אנימציית המתיחה והכיווץ */}
            <AnimatePresence>
                {isSortOn && (
                    <motion.div
                        className="sorting-options-wrapper"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="sorting-options" style={{ paddingBlock: '10px' }}>
                            <div className="sort-field">
                                <Select.Root
                                    value={filterBy.sortField || 'Trending'}
                                    onValueChange={(val) => handleChange({ target: { name: 'sortField', value: val } } as React.ChangeEvent<HTMLInputElement>)}
                                >
                                    <Select.Trigger className="sort-field-select radix-trigger">
                                        {filterBy.sortField === 'Trending' && <Trending />}
                                        {filterBy.sortField === 'Volume' && <Popular />}
                                        {filterBy.sortField === 'Newest' && <New />}
                                        <Select.Value />
                                        <Select.Icon className="radix-icon">
                                            <ChevronDownIcon />
                                        </Select.Icon>
                                    </Select.Trigger>

                                    <Select.Portal>
                                        <Select.Content className="radix-content" position="popper" sideOffset={5}>
                                            <Select.Viewport>
                                                <Select.Item value="Trending" className="radix-item">
                                                    <Trending />
                                                    <Select.ItemText>Most-Trending</Select.ItemText>
                                                </Select.Item>
                                                <Select.Item value="Volume" className="radix-item">
                                                    <Popular />
                                                    <Select.ItemText>Total Volume</Select.ItemText>
                                                </Select.Item>
                                                <Select.Item value="Newest" className="radix-item">
                                                    <New />
                                                    <Select.ItemText>Newest</Select.ItemText>
                                                </Select.Item>
                                            </Select.Viewport>
                                        </Select.Content>
                                    </Select.Portal>
                                </Select.Root>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    )
}