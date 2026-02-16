import React from 'react'

export const GridButton = ({ label, action = 'submit', variant, onAction, ...props }: any) => {
    // In the editor, this is just a visual representation usually, 
    // but in the actual app, it performs an action.

    // Simple variant logic using V2 classes
    let btnClass = "v2-btn v2-btn-primary" // Default to primary (Accent/Red)

    if (action === 'reset') btnClass = "v2-btn v2-btn-secondary"
    if (action === 'delete') btnClass = "v2-btn v2-btn-secondary border-red-900 text-red-500 hover:bg-red-950" // v2-btn-danger doesn't exist yet, custom override
    if (action === 'navigate') btnClass = "v2-btn v2-btn-secondary text-indigo-400 border-indigo-900 hover:bg-indigo-950"

    return (
        <button
            className={`${btnClass} w-full sm:w-auto`}
            onClick={() => {
                if (onAction) onAction(action)
                if (props.onClick) props.onClick()
            }}
            {...props}
        >
            {label || (action === 'submit' ? 'Save' : action)}
        </button>
    )
}
