// Formulario y Controles de Entrada
const formElement = document.getElementById('pokemon-form');
const nameInput = document.getElementById('poke-name');
const typeInput = document.getElementById('poke-type');
const imageInput = document.getElementById('poke-img');
const noteInput = document.getElementById('poke-note');

// Controles de Modo Edición
const editingIdInput = document.getElementById('editing-id'); // Input oculto

// Botones Principales
const saveButton = document.getElementById('btn-save');
const clearButton = document.getElementById('btn-clear');

// Lista y Estados
const favoritesList = document.getElementById('favorites-list'); // Contenedor de los ítems
const emptyState = document.getElementById('empty-state'); // Mensaje de lista vacía

// Funcionalidad de Búsqueda
const searchInput = document.getElementById('search-input');

// Funcionalidad de Importar/Exportar
const exportButton = document.getElementById('btn-export');
const importButton = document.getElementById('btn-import');
const importFileInput = document.getElementById('import-file'); // Input type="file"

let pokemons = []

addEventListener('DOMContentLoaded', () => {
    let lecPokemons = localStorage.getItem('pokemonsFavoritos')
    if (lecPokemons) {
        pokemons = JSON.parse(lecPokemons)
        renderList(pokemons)
    } else {
        pokemons = []
        renderList(pokemons)
    }

})

function renderList(pokemonsToRender) {
    favoritesList.textContent = ''
    if (pokemonsToRender.length === 0) {
        emptyState.style.display = 'block'

    } else {
        emptyState.style.display = 'none'
    }
    pokemonsToRender.forEach(pokemon => {
        const li = document.createElement('li')
        li.className = 'favorite-item'
        li.innerHTML = `
        <div class="pokemon-display">
        <img src="${pokemon.image || 'placeholder.png'}" alt="${pokemon.name}" onerror="this.src='placeholder.png'" class="pokemon-image">
        <div class="item-body">
            <h4>${pokemon.name}</h4>
            <p class="pokemon-type">Tipo: ${pokemon.type}</p>
            <p class="pokemon-note">${pokemon.note || 'Sin nota.'}</p>
        </div>
        <div class="actions">
            <button class="edit-button small" onClick="editPokemon(${pokemon.id})" data-id="${pokemon.id}">Editar</button>
            <button class="delete-button small" onClick="deletePokemon(${pokemon.id})" data-id="${pokemon.id}">Eliminar</button>
        </div>
    </div>
        `
        favoritesList.appendChild(li)
    })

}
function guardarPokemon() {
    let pokemonObject = {
        id: Date.now(),
        name: nameInput.value,
        type: typeInput.value,
        image: imageInput.value,
        note: noteInput.value

    }
    pokemons.unshift(pokemonObject)
    localStorage.setItem('pokemonsFavoritos', JSON.stringify(pokemons))
    renderList(pokemons)

    showToast('Pokémon guardado exitosamente.')
}

formElement.addEventListener('submit', (e) => {
    e.preventDefault()
    if (nameInput.value.trim() === '' || typeInput.value.trim() === '') {
        showToast('El nombre y tipo son obligatorios.', true)
        return
    }
    saveButton.disabled = true
    if (editingIdInput.value) {
        actualizarPokemon()
    } else {
        guardarPokemon()
    }
    saveButton.disabled = false

    //limpiar formulario
    formElement.reset()
    editingIdInput.value = ''
    if (saveButton.textContent === 'Actualizar Pokémon') {
        saveButton.textContent = 'Guardar Pokémon'
    }
})
editPokemon = (id) => {
    const pokemonObject = pokemons.find(pokemon => pokemon.id.toString() === id.toString())
    if (!pokemonObject) return
    nameInput.value = pokemonObject.name
    nameInput.focus()
    typeInput.value = pokemonObject.type
    imageInput.value = pokemonObject.image
    noteInput.value = pokemonObject.note

    editingIdInput.value = pokemonObject.id
    saveButton.textContent = 'Actualizar Pokémon'
}

actualizarPokemon = () => {
    const idToUpdate = editingIdInput.value
    const pokemonToUpdate = pokemons.find(p => p.id.toString() === idToUpdate.toString())
    if (pokemonToUpdate) {
        pokemonToUpdate.name = nameInput.value
        pokemonToUpdate.type = typeInput.value
        pokemonToUpdate.image = imageInput.value
        pokemonToUpdate.note = noteInput.value
    }

    localStorage.setItem('pokemonsFavoritos', JSON.stringify(pokemons))
    renderList(pokemons)

    showToast('Pokémon actualizado exitosamente.')

}

deletePokemon = (id) => {
    const confirmDelete = confirm('¿Estás seguro de que deseas eliminar este Pokémon de tus favoritos?')
    if (!confirmDelete) return
    pokemons = pokemons.filter(pokemon => pokemon.id.toString() !== id.toString())
    localStorage.setItem('pokemonsFavoritos', JSON.stringify(pokemons))
    renderList(pokemons)

    showToast('Pokémon eliminado exitosamente.')

}
const handleSearch = () => {
    const query = searchInput.value.toLowerCase()
    if (query.trim() === '') {
        renderList(pokemons)

    } else {
        const filteredPokemons = pokemons.filter(pokemon =>
            pokemon.name.toLowerCase().includes(query) ||
            pokemon.type.toLowerCase().includes(query)
        )
        renderList(filteredPokemons)
    }
}

let timeout
function debounce(func, delay) {
    return function () {
        const context = this
        const args = arguments
        clearTimeout(timeout)
        timeout = setTimeout(() => {
            func.apply(context, args)
        }, delay)
    }
}
searchInput.addEventListener('input', debounce(handleSearch, 300))

exportButton.addEventListener('click', () => {
    const dataStr = JSON.stringify(pokemons, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'pokemons_favoritos.json'
    a.click()

    a.remove()
    URL.revokeObjectURL(url)
    showToast('Lista exportada exitosamente.')
})

importButton.addEventListener('click', () => {
    importFileInput.click()
})

importFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
        try {
            const importedPokemons = JSON.parse(e.target.result)
            
            if (!Array.isArray(importedPokemons) || importedPokemons.length === 0 || importedPokemons.some(pokemon => !pokemon.id || !pokemon.name || !pokemon.type)) {

                showToast('El archivo importado no tiene el formato correcto.', true)
                e.target.value = null
                return
            }
            const replaceExisting = confirm('Importar este archivo reemplazará tu lista actual de Pokémon favoritos. ¿Deseas continuar? (Aceptar = Reemplazar, Cancelar = Fusionar)')
            if (replaceExisting) {
                pokemons = importedPokemons

                showToast('Pokémons importados y reemplazados exitosamente.')

            } else {
                importedPokemons.forEach(importedPokemon => {
                    if (!pokemons.some(existingPokemon => existingPokemon.id.toString() === importedPokemon.id.toString())) {
                        pokemons.push(importedPokemon)
                    }
                })

                showToast('Pokémons importados y fusionados exitosamente.')

            }
            localStorage.setItem('pokemonsFavoritos', JSON.stringify(pokemons))
            renderList(pokemons)

            e.target.value = null
        } catch (error) {

            showToast('Error al importar el archivo. Asegúrate de que es un archivo JSON válido.', true)
            e.target.value = null
            return
        }


    }
    reader.readAsText(file)
})

function showToast(message, isError = false) {
    const toast = document.createElement('div')
    toast.className = `toast ${isError ? 'toast-error' : 'toast-success'}`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => {
        toast.remove()
    }, 3000);
}