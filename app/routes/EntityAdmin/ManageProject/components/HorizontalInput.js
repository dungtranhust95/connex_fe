import React from "react";
import classNames from "classnames";
import {
    Label, Row, Col
} from "reactstrap";
import {
    Field, ErrorMessage
} from "formik";

const HorizontalInput = (props) => {
    const {
        label, disabled, name,
        type, className, placeholder,
        errors, touched, upperCase, onChange, value
    } = props;
    return (
        <Row className={`${className || ""} form-group`}>
            {
                label
                    ? (
                        <>
                            <Col md={4} lg={4}>
                                <Label className="p-0">{label}</Label>
                            </Col>
                            <Col md={8} lg={8}>
                                <Field
                                    name={name}
                                    type={type}
                                    onChange={onChange}
                                    value={value}
                                    disabled={disabled || false}
                                    placeholder={placeholder}
                                    className={classNames(
                                        "form-control",
                                        { "is-invalid": errors && touched },
                                        { "text-uppercase": upperCase || false }
                                    )}
                                />
                                <ErrorMessage name={name} component="div" className="invalid-feedback" />
                            </Col>
                        </>
                    ) : (
                        <Col md={12} lg={12}>
                            <Field
                                name={name}
                                type={type}
                                disabled={disabled || false}
                                placeholder={placeholder}
                                className={classNames(
                                    "form-control",
                                    { "is-invalid": errors && touched },
                                    { "text-uppercase": upperCase || false }
                                )}
                            />
                            <ErrorMessage name={name} component="div" className="invalid-feedback" />
                        </Col>
                    )
            }
        </Row>
    );
};

export default HorizontalInput;
