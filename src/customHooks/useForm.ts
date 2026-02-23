import { useState, ChangeEvent } from "react"

export const useForm = <T extends object>(initialState: T) => {
    const [fields, setFields] = useState<T>(initialState)

    function handleChange({ target }: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const field = target.name
        let value: unknown

        switch (target.type) {
            case 'number':
            case 'range':
                value = target.value ? Number(target.value) : ''
                break
            case 'checkbox':
                value = (target as HTMLInputElement).checked
                break
            default:
                value = target.value
                break
        }

        setFields((prevFields) => ({
            ...prevFields,
            [field]: value
        }))
    }

    return [fields, handleChange, setFields] as const
}

//this hook is a generic form handler that can be used for any form in the application.
//  It takes an initial state object and returns the current form fields,
//  a handleChange function to update the fields,
//  and a setFields function to manually set the fields if needed. 
// The handleChange function is designed to work with various input types,
//  including text, number, checkbox, and select elements.