function DeleteClassPopUp({ isOpen, onConfirm, onCancel, title, message, confirmText = "Delete", cancelText = "Cancel", isDestructive = false }) {
    if (!isOpen) {
        return null
    }

    return (
        <div className = "deleteOverlay" onClick = {onCancel}>
            <div className = "deleteContent" onClick = {(e) => e.stopPropagation()}>
                <div className = "deleteHeader">
                    <h3>{title}</h3>
                </div>

                <div className = "deleteBody">
                    <p>{message}</p>
                </div>

                <div className = "deleteActions">
                    <button
                        onClick = {onCancel}
                        className = "btn btn-secondary"
                    >{cancelText}</button>
                    <button
                        onClick = {onConfirm}
                        className = {`btn ${isDestructive ? 'btn-danger' : 'btn-primary'}`}
                    >{confirmText}</button>
                </div>
            </div>
        </div>
    )
}

export default DeleteClassPopUp;