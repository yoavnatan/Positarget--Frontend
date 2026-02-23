import { FilterBy } from '../types/market'
import { useForm } from '../customHooks/useForm'
import { useEffectUpdate } from '../customHooks/useEffectUpdate'

export function MarketFilter({ filterBy, setFilterBy }: { filterBy: FilterBy, setFilterBy: (filterBy: FilterBy) => void }) {

    const [filterToEdit, handleChange, setFilterToEdit] = useForm(structuredClone(filterBy))


    useEffectUpdate(() => {
        setFilterBy(filterToEdit)
    }, [filterToEdit])

    function clearFilter() {
        setFilterToEdit(prev => ({ ...prev, txt: '' }))
    }

    function clearSort() {
        setFilterToEdit(prev => ({ ...prev, sortField: '', sortDir: 1 }))
    }

    return (
        <section className="market-filter">
            <h3>Filter:</h3>
            <input
                type="text"
                name="txt"
                value={filterToEdit.txt}
                placeholder="Free text"
                onChange={handleChange}
            />
            <button className="btn-clear" onClick={clearFilter}>Clear</button>

            <h3>Sort:</h3>
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
            </div>
            <button className="btn-clear" onClick={clearSort}>Clear</button>
        </section>
    )
}