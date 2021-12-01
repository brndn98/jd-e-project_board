window.addEventListener("load", function () {
    // inicia el funcionamiento
    fetchProjects();

    // fetchProjects() -> envia una peticion al endpoint de los proyectos y devuelve la lista de proyectos en formato json
    function fetchProjects() {
        /*
        fetch(url) -> funcion de js para ejecutar promesas / peticiones asincronas
            #url : endpoint en donde se hace la peticion
            return => respuesta resuelta con la informacion solicitada / error
        */
        fetch("../data/projects.json")
            .then((response) => response.json())
            .then((data) => {
                // con la informacion de los proyectos se inicia el tablero
                initBoard(data);
            })
            .catch((error) => console.log(error));
    }

    /*
    initBoard(projects) -> inicializa el componente, activa los eventos y muestra la informacion del tablero
        #projects : lista de datos del contenido a manipular en el tablero, esta variable sigue todo el flujo hasta llegar a la creacion del markup
    */
    function initBoard(projects) {
        // obtiene los elementos que operan el filtro y activa sus eventos para actualizar el estado del tablero
        var boardSelects = document.querySelectorAll(".board-select");
        var boardSubmit = document.querySelector(".board-submit");

        boardSelects.forEach((select, sIndex) => {
            select.addEventListener("change", function () {
                // cuando algun select cambia de valor entonces se intercambian las opciones disponibles en todos los select
                toggleBoardFilters(boardSelects, sIndex, select.selectedIndex);
            });
        });

        boardSubmit.addEventListener("click", function (event) {
            event.preventDefault();
            // cuando se confirme el filtro entonces actualiza la informacion de los filtros dentro del tablero
            setBoardFilters(projects);
        });

        // se define la informacion de los filtros inicialmente antes de alguna interaccion con el usuario
        setBoardFilters(projects);
    }

    /*
    toggleBoardFilters(filters, current, selected) -> recorre todos los select y deshabilita la opcion actual seleccionada en la lista de opciones del resto, esto para evitar seleccionar el mismo valor en diferentes select
        #filters : lista de elementos select que operan el filtro del tablero
        #current : indice del elemento select que activa la funcion al cambiar su valor
        #selected : indice de la opcion seleccionada
    */
    function toggleBoardFilters(filters, current, selected) {
        filters.forEach((filter, fIndex) => {
            if (fIndex != current) {
                for (var i = 0; i < filter.options.length; i++) {
                    filter.options[i].disabled = i == selected;
                }
            }
        });
    }

    /*
    setBoardFilters(projects) -> establece y actualiza la informacion de los filtros que se muestran en el tablero
        #projects : lista de datos del contenido a manipular en el tablero
    */
    function setBoardFilters(projects) {
        var columnsSelect = document.querySelector("#filter-columns");
        var rowsSelect = document.querySelector("#filter-rows");

        // se valida que los valores no sean iguales para continuar con los datos de los filtros
        if (columnsSelect.value != rowsSelect.value) fetchFilters(columnsSelect.value, rowsSelect.value, projects);
    }

    /*
    fetchFilters(columns, rows, projects) -> envia peticiones a los endpoints de los filtros y devuelve sus datos en formato json, ademas interrumpe los eventos y controla el estado del tablero mientras se resuelve la promesa
        #columns : valor del filtro para las columnas dentro del tablero
        #rows : valor del filtro para las filas dentro del tablero
        #projects : lista de datos del contenido a manipular en el tablero
    */
    function fetchFilters(columns, rows, projects) {
        // se define el comportamiento de espera
        var boardContainer = document.querySelector("#board-container");
        var boardSubmit = document.querySelector(".board-submit");
        boardContainer.className += " board-container-loading-mask";
        boardSubmit.disabled = true;

        setTimeout(function () {
            /*
            Promise.all(promises) -> funcion de js para ejecutar multiples promesas asincronas
                #url : endpoint en donde se hace la peticion
                return => lista de respuestas resueltas con la informacion solicitada / error
            */
            Promise.all([fetch("../data/" + columns + ".json"), fetch("../data/" + rows + ".json")])
                .then((responses) => {
                    return Promise.all(responses.map((response) => response.json()));
                })
                .then((data) => {
                    // se define el comportamiento al terminar la espera
                    boardContainer.className = boardContainer.className.replace(" board-container-loading-mask", "");
                    boardSubmit.disabled = false;

                    // ordena los datos en orden descendente en caso de que el filtro sea por linea de tiempo
                    if (columns == "years") data[0].sort((a, b) => parseInt(b.title, 10) - parseInt(a.title, 10));
                    if (rows == "years") data[1].sort((c, d) => parseInt(d.title, 10) - parseInt(c.title, 10));
                    // con la informacion lista, se actualiza el tablero
                    setBoard(data[0], data[1], projects, { col: columns, row: rows });
                })
                .catch((error) => console.log(error));
        }, 500);
    }

    /*
    setBoard(columns, rows, projects, filters) -> establece y actualiza la estructura del tablero creando dinamicamente las filas y columnas que lo componen
        #columns : lista de datos del filtro por columna del tablero
        #rows : lista de datos del filtro por fila del tablero
        #projects : lista de datos del contenido a manipular en el tablero
        #filters : lista de los valores seleccionados del filtro
    */
    function setBoard(columns, rows, projects, filters) {
        // se vacia el tablero
        var boardContainer = document.querySelector("#board-container");
        boardContainer.innerHTML = "";

        // se obtiene la primer fila del tablero sin pasar algun valor, esto para obtener una fila de encabezados
        var columnsHeader = getBoardRow(false);
        columns.forEach((column) => {
            // se obtiene cada celda de tipo encabezado y se agrega a la fila
            var columnHeader = getBoardCell(column.title, true);
            columnsHeader.appendChild(columnHeader);
        });
        boardContainer.appendChild(columnsHeader); // agrega la primer fila al tablero

        // se recorre el filtro por filas y prepara la estructura de cada fila de contenido
        rows.forEach((row) => {
            var currentRow = getBoardRow(row.title);

            // por cada fila se recorre el filtro por columnas para comparar con los proyectos
            columns.forEach((col) => {
                // recorre la lista de proyectos y crea una nueva con los proyectos que coinciden con ambos filtros
                var matchProjects = projects.filter((project) => {
                    // filtro en base a busqueda de atributo array con array
                    var colArray = Array.isArray(project[filters.col]) ? project[filters.col] : [project[filters.col]];
                    var rowArray = Array.isArray(project[filters.row]) ? project[filters.row] : [project[filters.row]];
                    var foundColFilter = colArray.filter((key) => key.id == col.id);
                    var foundRowFilter = rowArray.filter((key) => key.id == row.id);

                    return foundColFilter.length > 0 && foundRowFilter.length > 0 ? true : false;
                });

                // en caso de que haya proyectos que coincidan con los filtros se obtiene una celda con el contenido, de lo contrario se obtiene una celda vacia, y se agrega a la fila actual
                var currentCell = matchProjects.length > 0 ? getBoardCell(matchProjects, false) : getBoardCell(false, false);
                currentRow.appendChild(currentCell);
            });

            boardContainer.appendChild(currentRow); // agrega la fila al tablero
        });
    }

    /*
    getBoardRow(header) -> crea el markup de una fila del tablero con una celda inicial y devuelve su estructura en una variable
        #header : valor del encabezado a mostrar / sin valor (false)
        return => estructura de la fila creada
    */
    function getBoardRow(header) {
        // se crea la fila y se valida que si #header tiene valor entonces es una fila de proyectos de lo contrario es una fila de encabezados
        var row = document.createElement("div");
        row.className = header ? "board-row row-projects" : "board-row header-column";

        // si #header tiene valor entonces se crea la primer celda como encabezado de lo contrario la primer celda es vacia
        var firstCell = header ? getBoardCell(header, true) : getBoardCell(false, true);
        row.appendChild(firstCell);

        return row;
    }

    /*
    getBoardCell(data, isHeader) -> crea el markup de una celda individual del tablero y devuelve su estructura en una variable
        #data : datos del contenido a mostrar en el tablero / sin contenido (false)
        #isHeader : valida si la celda por crearse es un encabezado del tablero
        return => estructura de la celda creada
    */
    function getBoardCell(data, isHeader) {
        // se crea la celda
        var cell = document.createElement("div");
        cell.className = isHeader ? "board-cell board-header" : "board-cell board-content";
        if (data) {
            if (isHeader) {
                // se crea la estructura del encabezado
                var headerTitle = document.createElement("h2");
                var headerText = document.createTextNode(data);
                headerTitle.appendChild(headerText);
                cell.appendChild(headerTitle);
            } else {
                var defaultZIndex = 100; // controla la visualizacion en caso de multiples proyectos en una celda
                data.forEach((project) => {
                    // se crea la estructura de cada proyecto dentro de la celda
                    var cellProject = document.createElement("div");
                    cellProject.className = data.length > 1 ? "cell-multiproject" : "cell-project";
                    cellProject.style.zIndex = defaultZIndex--;
                    var projectImage = document.createElement("img");
                    projectImage.setAttribute("src", "../images/placeholder.png"); // * dev only
                    cellProject.appendChild(projectImage);

                    cell.appendChild(cellProject);
                });
                if (data.length > 1) {
                    // se agrega un contador en caso de multiples proyectos en una celda
                    var projectCounter = document.createElement("div");
                    projectCounter.className = "cell-counter";
                    projectCounter.textContent = data.length;

                    cell.appendChild(projectCounter);
                }
            }
        } else {
            cell.className += " empty-cell";
        }

        return cell;
    }
});
