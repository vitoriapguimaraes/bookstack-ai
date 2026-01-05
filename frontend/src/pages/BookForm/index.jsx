import BookForm from '../../components/BookForm'

export default function FormView({ editingBook, onFormSuccess, onCancel }) {
  return (
    <div className="pb-20 animate-fade-in">
      <BookForm 
        bookToEdit={editingBook}
        onSuccess={onFormSuccess}
        onCancel={onCancel}
      />
    </div>
  )
}
