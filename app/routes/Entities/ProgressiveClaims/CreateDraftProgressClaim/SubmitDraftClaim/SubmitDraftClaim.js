import React, {
    useEffect,
    useState
} from "react";
import { Link } from "react-router-dom";
import URL_CONFIG from "services/urlConfig";
import useToast from "routes/hooks/useToast";
import { useTranslation } from "react-i18next";
import { ToastContainer } from "react-toastify";
import { AgGridReact } from "components/agGrid";
import {
    useHistory,
    useLocation
} from "react-router";
import { HeaderMain } from "routes/components/HeaderMain";
import {
    ButtonGroup,
    ButtonToolbar,
    Col,
    Container,
    Row,
    Button
} from "components";
import _ from "lodash";
import { useSelector } from "react-redux";
import { DraftProgressiveClaimService } from "services/DraftProgressiveClaimService";
import {
    defaultColDef,
    CreateDraftProgressClaimColumnDefs,
    mockData
} from "../Helper";
import {
    DWO_STATUSES,
    RESPONSE_STATUS,
    VENDOR_ACK
} from "../../../../../helper/constantsDefined";
import { AgGridTable } from "../../../../components";
import CONTRACT_REQUEST_FORM_ROUTE from "../../../../../services/ContractModuleService/urls";

export default function SubmitDraftClaim() {
    const { t } = useTranslation();
    const history = useHistory();
    const location = useLocation();
    const showToast = useToast();
    const permissionReducer = useSelector((state) => state.permissionReducer);
    const authReducer = useSelector((state) => state.authReducer);
    const [draftProgressClaimState, setDraftProgressClaimState] = useState({
        loading: false,
        gridApi: null,
        draftList: [],
        selectRow: {}
    });
    console.log("draftProgressClaimState", draftProgressClaimState);

    const getData = async (companyUuid) => {
        const { gridApi } = draftProgressClaimState;
        gridApi.showLoadingOverlay();
        try {
            const response = await DraftProgressiveClaimService
                .getClaimList(companyUuid);
            gridApi.hideOverlay();

            if (response.data.status === RESPONSE_STATUS.OK) {
                const draftList = response.data.data;
                setDraftProgressClaimState((prevStates) => ({
                    ...prevStates,
                    draftList: draftList.length > 0 ? draftList
                        .filter((item) => (
                            item.dwoStatus === DWO_STATUSES.IN_PROGRESS
                            && item.vendorAck === VENDOR_ACK.ACKNOWLEDGED
                        ))
                        .map((item) => {
                            const draft = item;
                            draft.isVisible = true;
                            return draft;
                        }) : draftList
                }));

                if (response.data.data.length === 0) {
                    gridApi.showNoRowsOverlay();
                }
            } else {
                showToast("error", response.data.message);
            }
        } catch (error) {
            showToast("error", error.response ? error.response.data.message : error.message);
            setDraftProgressClaimState((prevState) => ({
                ...prevState,
                draftList: mockData.map((item) => {
                    const draft = item;
                    draft.isVisible = true;
                    return draft;
                })
            }));
            gridApi.showNoRowsOverlay();
        }
    };

    const onGridReady = (params) => {
        params.api.showLoadingOverlay();
        setDraftProgressClaimState((prevStates) => ({
            ...prevStates,
            gridApi: params.api
        }));
    };

    const selectWorkOrder = (params) => {
        history.push(URL_CONFIG.PROGRESSIVE_ROUTES.SUBMIT_DRAFT_CLAIM_CREATE.replace(":dwoUuId", params.data.dwoUuid));
    };

    const onRowSelected = (event) => {
        let rowSelected = {};
        const draftList = draftProgressClaimState.draftList.map((item) => {
            const draft = item;
            draft.isVisible = true;
            if (event.node.isSelected()) {
                draft.isVisible = draft.dwoUuid === event.data.dwoUuid;
                rowSelected = event.data;
            }
            return draft;
        });
        setDraftProgressClaimState((prevState) => ({
            ...prevState,
            selectRow: rowSelected,
            draftList
        }));
        draftProgressClaimState.gridApi.onFilterChanged();
    };

    const doesFilterVisible = (node) => node.data.isVisible;

    const createDraftClaim = async () => {
        try {
            const response = await DraftProgressiveClaimService.createDraftClaim(
                permissionReducer.currentCompany?.companyUuid,
                draftProgressClaimState.selectRow.dwoUuid
            );

            showToast("success", response.data?.message);
            setTimeout(() => {
                history.push({
                    pathname: URL_CONFIG.PROGRESSIVE_ROUTES.DRAFT_PROGRESS_CLAIM_LIST_CREATE.replace(":dpcUuid", response.data.data)
                });
            }, 1000);
        } catch (error) {
            showToast("error", error.response ? error.response.data.message : error.message);
        }
    };

    useEffect(() => {
        if (
            permissionReducer
            && permissionReducer?.currentCompany
            && draftProgressClaimState.gridApi
        ) {
            getData(permissionReducer.currentCompany.companyUuid);
        }
    }, [permissionReducer, draftProgressClaimState.gridApi]);

    return (
        <Container fluid>
            <Row className="mb-1">
                <Col lg={12}>
                    <HeaderMain
                        title={t("Create Draft Progress Claim")}
                        className="mb-3 mb-lg-3"
                    />
                </Col>
            </Row>
            <Row>
                <Col lg={12}>
                    <div className="d-flex mb-2">
                        <ButtonToolbar className="ml-auto">
                            <ButtonGroup className="align-self-start">
                                {
                                    permissionReducer?.currentCompany && (
                                        <Button
                                            color="primary"
                                            className="mb-2 mr-2 px-3"
                                            disabled={!draftProgressClaimState.selectRow.dwoUuid}
                                            onClick={createDraftClaim}
                                        >
                                            <i className="fa fa-plus" /> {t("Create Claims")}
                                        </Button>
                                    )
                                }
                            </ButtonGroup>
                        </ButtonToolbar>
                    </div>
                </Col>
            </Row>
            <Row className="mb-3">
                <Col lg={12}>
                    <div className="ag-theme-custom-react" style={{ height: "500px" }}>
                        <AgGridTable
                            columnDefs={CreateDraftProgressClaimColumnDefs}
                            defaultColDef={defaultColDef}
                            rowData={draftProgressClaimState.draftList}
                            pagination
                            paginationPageSize={10}
                            onGridReady={onGridReady}
                            rowSelection="multiple"
                            rowMultiSelectWithClick
                            onRowDoubleClicked={selectWorkOrder}
                            onCellClicked={() => {
                            }}
                            suppressRowClickSelection
                            onSelectionChanged={() => {
                            }}
                            onRowSelected={onRowSelected}
                            gridHeight={580}
                            isExternalFilterPresent={() => true}
                            doesExternalFilterPass={doesFilterVisible}
                            onComponentStateChanged={(params) => {
                                params.api.sizeColumnsToFit();
                            }}
                        />
                    </div>
                </Col>
            </Row>
        </Container>
    );
}
