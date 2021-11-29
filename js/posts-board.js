window.addEventListener("load", function () {
    fetchProjects();

    function fetchProjects() {
        fetch("../data/projects.json")
            .then((response) => response.json())
            .then((data) => {
                initBoard(data);
            })
            .catch((error) => console.log(error));
    }

    function initBoard(projects) {
        var boardSelects = document.querySelectorAll(".board-select");
        var boardSubmit = document.querySelector(".board-submit");

        boardSelects.forEach((select, sIndex) => {
            select.addEventListener("change", function () {
                toggleBoardFilters(boardSelects, sIndex, select.selectedIndex);
            });
        });

        boardSubmit.addEventListener("click", function (event) {
            event.preventDefault();
            setBoardFilters(projects);
        });

        setBoardFilters(projects);
    }

    function toggleBoardFilters(filters, current, selected) {
        filters.forEach((filter, fIndex) => {
            if (fIndex != current) {
                for (var i = 0; i < filter.options.length; i++) {
                    filter.options[i].disabled = i == selected;
                }
            }
        });
    }

    function setBoardFilters(projects) {
        var columnsSelect = document.querySelector("#filter-columns");
        var rowsSelect = document.querySelector("#filter-rows");

        // get selected board filters
        var columnsFilter = columnsSelect.value;
        var rowsFilter = rowsSelect.value;

        if (columnsFilter != rowsFilter) fetchFilters(columnsFilter, rowsFilter, projects);
    }

    function fetchFilters(columns, rows, projects) {
        var boardContainer = document.querySelector("#board-container");
        var boardSubmit = document.querySelector(".board-submit");
        boardContainer.className += " board-container-loading-mask";
        boardSubmit.disabled = true;

        setTimeout(function () {
            Promise.all([fetch("../data/" + columns + ".json"), fetch("../data/" + rows + ".json")])
                .then((responses) => {
                    return Promise.all(responses.map((response) => response.json()));
                })
                .then((data) => {
                    boardContainer.className = boardContainer.className.replace(" board-container-loading-mask", "");
                    boardSubmit.disabled = false;

                    if (columns == "years") data[0].sort((a, b) => parseInt(b.title, 10) - parseInt(a.title, 10));
                    if (rows == "years") data[1].sort((c, d) => parseInt(d.title, 10) - parseInt(c.title, 10));
                    setBoard(data[0], data[1], projects, { col: columns, row: rows });
                })
                .catch((error) => console.log(error));
        }, 500);
    }

    function setBoard(columns, rows, projects, filters) {
        var boardContainer = document.querySelector("#board-container");
        boardContainer.innerHTML = "";

        var columnsHeader = getBoardRow(false);
        columns.forEach((column) => {
            var columnHeader = getBoardCell(column.title, true);
            columnsHeader.appendChild(columnHeader);
        });
        boardContainer.appendChild(columnsHeader);

        rows.forEach((row) => {
            var currentRow = getBoardRow(row.title);

            columns.forEach((col) => {
                var matchProjects = projects.filter((project) => {
                    var colArray = Array.isArray(project[filters.col]) ? project[filters.col] : [project[filters.col]];
                    var rowArray = Array.isArray(project[filters.row]) ? project[filters.row] : [project[filters.row]];
                    var foundColFilter = colArray.filter((key) => key.id == col.id);
                    var foundRowFilter = rowArray.filter((key) => key.id == row.id);

                    return foundColFilter.length > 0 && foundRowFilter.length > 0 ? true : false;
                });

                var currentCell = matchProjects.length > 0 ? getBoardCell(matchProjects, false) : getBoardCell(false, false);
                currentRow.appendChild(currentCell);
            });

            boardContainer.appendChild(currentRow);
        });
    }

    function getBoardRow(header) {
        var row = document.createElement("div");
        row.className = header ? "board-row row-projects" : "board-row header-column";

        var firstCell = header ? getBoardCell(header, true) : getBoardCell(false, true);
        row.appendChild(firstCell);

        return row;
    }

    function getBoardCell(data, isHeader) {
        var cell = document.createElement("div");
        cell.className = isHeader ? "board-cell board-header" : "board-cell board-content";
        if (data) {
            if (isHeader) {
                var headerTitle = document.createElement("h2");
                var headerText = document.createTextNode(data);
                headerTitle.appendChild(headerText);
                cell.appendChild(headerTitle);
            } else {
                var defaultZIndex = 100;
                data.forEach((project) => {
                    var cellProject = document.createElement("div");
                    cellProject.className = data.length > 1 ? "cell-multiproject" : "cell-project";
                    cellProject.style.zIndex = defaultZIndex--;
                    // * dev only
                    var projectImage = document.createElement("img");
                    projectImage.setAttribute("src", "../images/placeholder.png");
                    cellProject.appendChild(projectImage);
                    /* var projectTitle = document.createElement("p");
                    var titleText = document.createTextNode(project.title);
                    projectTitle.appendChild(titleText);
                    cellProject.appendChild(projectTitle); */

                    cell.appendChild(cellProject);
                });
                if (data.length > 1) {
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
