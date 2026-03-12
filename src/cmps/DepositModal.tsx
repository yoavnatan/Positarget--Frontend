import { useState, useEffect } from 'react'
import { useAppDispatch } from '../store/store'
import { updateUserCash } from '../store/slices/user.slice'
import { setModalType, setMsg } from '../store/slices/system.slice'
import { useForm } from '../customHooks/useForm'
import { convertToUsdc } from '../services/currencyAPI'
import { Modal } from './Modal'
import * as Select from '@radix-ui/react-select'
import { ChevronDownIcon } from '@radix-ui/react-icons'

export function DepositModal() {
    const dispatch = useAppDispatch()
    const [depositFields, handleDepositChange] = useForm({ amount: 0, currency: 'ILS' })
    const [convertedAmount, setConvertedAmount] = useState<number>(0)

    useEffect(() => {
        onConvertCurrency()
    }, [depositFields])

    async function onConvertCurrency() {
        const converted = await convertToUsdc(depositFields.currency, depositFields.amount)
        if (converted >= 0) setConvertedAmount(converted)
    }

    async function handleDeposit(ev: React.MouseEvent) {
        ev.preventDefault()
        if (!convertedAmount || convertedAmount <= 0) return

        try {
            await dispatch(updateUserCash(convertedAmount)).unwrap()
            dispatch(setModalType(null))
            dispatch(setMsg({ txt: `Successfully deposited $${convertedAmount}`, type: 'success' }))
        } catch (err) {
            dispatch(setMsg({ txt: 'Deposit failed', type: 'error' }))
        }
    }

    return (
        <Modal>
            <header>Deposit Funds</header>
            <div className="inputs-container flex">
                <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    name="amount"
                    value={depositFields.amount || ''}
                    onChange={handleDepositChange}
                    className="amount-input"
                />
                <Select.Root
                    value={depositFields.currency || 'USD'}
                    onValueChange={(val) => handleDepositChange({ target: { name: 'currency', value: val } } as any)}
                >
                    <Select.Trigger className="currency-select radix-trigger">
                        <Select.Value />
                        <Select.Icon className="radix-icon"><ChevronDownIcon /></Select.Icon>
                    </Select.Trigger>
                    <Select.Portal>
                        <Select.Content className="radix-content" position="popper" sideOffset={5}>
                            <Select.Viewport>
                                <Select.Item value="USD" className="radix-item"><Select.ItemText>USD</Select.ItemText></Select.Item>
                                <Select.Item value="ILS" className="radix-item"><Select.ItemText>ILS</Select.ItemText></Select.Item>
                            </Select.Viewport>
                        </Select.Content>
                    </Select.Portal>
                </Select.Root>
            </div>
            <h2>{convertedAmount ? convertedAmount.toFixed(2) : '0.00'} USDC</h2>
            <div className="btns">
                <button className="confirm-btn signup-link" onClick={handleDeposit}>Confirm</button>
                <button className="cancel-btn login-link" onClick={() => dispatch(setModalType(null))}>Cancel</button>
            </div>
        </Modal>
    )
}